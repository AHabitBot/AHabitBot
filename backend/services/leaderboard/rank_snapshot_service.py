import asyncio
import logging
from backend.database.database import get_connection
from backend.services.leaderboard.season_service import get_season_context


logger = logging.getLogger("uvicorn.error")
SNAPSHOT_CHECK_INTERVAL_SECONDS = 60


async def create_daily_rank_snapshot() -> None:
    """
    Создаёт один базовый snapshot позиций на текущую дату.

    Идемпотентно: повторный вызов в тот же день обновляет строки,
    но сервис вызывает эту функцию только если snapshot за сегодня
    ещё отсутствует.
    """
    season_context = get_season_context()
    snapshot_date = season_context.current_date
    season_number = season_context.number

    async with get_connection() as connection:
        async with connection.transaction():
            await connection.execute(
                """
                INSERT INTO leaderboard_rank_snapshots (
                    snapshot_date,
                    leaderboard_type,
                    season_number,
                    user_id,
                    rank
                )
                SELECT
                    $1::DATE,
                    'global',
                    0,
                    ranked.user_id,
                    ranked.rank
                FROM (
                    SELECT
                        stats.user_id,
                        ROW_NUMBER() OVER (
                            ORDER BY
                                stats.total_xp DESC,
                                stats.user_id ASC
                        )::INTEGER AS rank
                    FROM user_stats AS stats
                ) AS ranked
                ON CONFLICT (
                    snapshot_date,
                    leaderboard_type,
                    season_number,
                    user_id
                )
                DO UPDATE SET
                    rank = EXCLUDED.rank,
                    created_at = NOW()
                """,
                snapshot_date,
            )

            if season_context.xp_active:
                await connection.execute(
                    """
                    INSERT INTO leaderboard_rank_snapshots (
                        snapshot_date,
                        leaderboard_type,
                        season_number,
                        user_id,
                        rank
                    )
                    SELECT
                        $1::DATE,
                        'season',
                        $2,
                        ranked.user_id,
                        ranked.rank
                    FROM (
                        SELECT
                            season_stats.user_id,
                            ROW_NUMBER() OVER (
                                ORDER BY
                                    season_stats.season_xp DESC,
                                    season_stats.user_id ASC
                            )::INTEGER AS rank
                        FROM user_season_stats AS season_stats
                        WHERE
                            season_stats.season_number = $2
                            AND season_stats.season_xp > 0
                    ) AS ranked
                    ON CONFLICT (
                        snapshot_date,
                        leaderboard_type,
                        season_number,
                        user_id
                    )
                    DO UPDATE SET
                        rank = EXCLUDED.rank,
                        created_at = NOW()
                    """,
                    snapshot_date,
                    season_number,
                )


async def has_snapshot_for_today() -> bool:
    season_context = get_season_context()
    snapshot_date = season_context.current_date

    async with get_connection() as connection:
        global_exists = bool(
            await connection.fetchval(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM leaderboard_rank_snapshots
                    WHERE snapshot_date = $1
                      AND leaderboard_type = 'global'
                      AND season_number = 0
                )
                """,
                snapshot_date,
            )
        )

        if not global_exists:
            return False

        if not season_context.xp_active:
            return True

        return bool(
            await connection.fetchval(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM leaderboard_rank_snapshots
                    WHERE snapshot_date = $1
                      AND leaderboard_type = 'season'
                      AND season_number = $2
                )
                """,
                snapshot_date,
                season_context.number,
            )
        )


async def ensure_daily_rank_snapshot() -> None:
    if await has_snapshot_for_today():
        return

    await create_daily_rank_snapshot()

    logger.info(
        "Leaderboard Rank Snapshot: сохранён snapshot за %s",
        get_season_context().current_date,
    )


async def run_rank_snapshot_loop() -> None:
    logger.info("Leaderboard Rank Snapshot Service запущен")

    while True:
        try:
            await ensure_daily_rank_snapshot()

        except asyncio.CancelledError:
            logger.info("Leaderboard Rank Snapshot Service остановлен")
            raise

        except Exception:
            logger.exception(
                "Leaderboard Rank Snapshot Service: ошибка цикла"
            )

        await asyncio.sleep(SNAPSHOT_CHECK_INTERVAL_SECONDS)
