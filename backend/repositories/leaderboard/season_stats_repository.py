from collections import defaultdict

from backend.database.database import (
    get_connection,
)
from backend.services.leaderboard.season_service import (
    SEASON_START_DATE,
    get_season_number,
)


# =========================================================
# ПЕРЕСОБРАТЬ ВСЮ СЕЗОННУЮ СТАТИСТИКУ
# =========================================================

async def rebuild_user_season_stats() -> int:
    """
    Полностью пересобирает user_season_stats
    на основании habit_confirmations.

    Учитываются только подтверждения:

    - начиная с 1 июня 2026 года;
    - is_confirmed = TRUE;
    - xp_awarded = TRUE.

    Возвращает количество созданных
    сезонных строк пользователей.
    """

    async with get_connection() as connection:
        async with connection.transaction():

            confirmation_rows = await connection.fetch(
                """
                SELECT
                    h.user_id,
                    hc.confirmation_date,
                    hc.xp_amount

                FROM habit_confirmations AS hc

                INNER JOIN habits AS h
                    ON h.id = hc.habit_id

                WHERE hc.confirmation_date >= $1
                  AND hc.is_confirmed = TRUE
                  AND hc.xp_awarded = TRUE

                ORDER BY
                    hc.confirmation_date ASC,
                    h.user_id ASC,
                    hc.id ASC
                """,
                SEASON_START_DATE,
            )

            season_totals: dict[
                tuple[int, int],
                int,
            ] = defaultdict(int)

            for row in confirmation_rows:
                season_number = get_season_number(
                    row["confirmation_date"]
                )

                key = (
                    season_number,
                    row["user_id"],
                )

                season_totals[key] += int(
                    row["xp_amount"] or 0
                )

            await connection.execute(
                """
                DELETE FROM user_season_stats
                """
            )

            if not season_totals:
                return 0

            records = [
                (
                    season_number,
                    user_id,
                    season_xp,
                )
                for (
                    season_number,
                    user_id,
                ), season_xp
                in season_totals.items()
            ]

            await connection.executemany(
                """
                INSERT INTO user_season_stats (
                    season_number,
                    user_id,
                    season_xp
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                """,
                records,
            )

            return len(records)