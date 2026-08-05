import asyncpg

from backend.database.database import (
    get_connection,
)


# =========================================================
# ПОЛУЧИТЬ ТОП-100 ГЛОБАЛЬНОГО РЕЙТИНГА
# =========================================================

async def get_global_leaderboard_users(
    limit: int = 100,
) -> list[asyncpg.Record]:
    safe_limit = max(
        1,
        min(limit, 100),
    )

    async with get_connection() as connection:
        return await connection.fetch(
            """
            SELECT
                ROW_NUMBER() OVER (
                    ORDER BY
                        stats.total_xp DESC,
                        stats.user_id ASC
                )::INTEGER AS rank,

                users.id AS user_id,
                users.nickname,
                users.avatar_key,

                stats.total_xp,
                stats.current_streak

            FROM user_stats AS stats

            INNER JOIN users
                ON users.id = stats.user_id

            ORDER BY
                stats.total_xp DESC,
                stats.user_id ASC

            LIMIT $1
            """,
            safe_limit,
        )


# =========================================================
# ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ И ЕГО МЕСТО
# =========================================================

async def get_global_current_user(
    user_id: int,
) -> asyncpg.Record | None:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            SELECT
                current_stats.user_id,
                user_data.nickname,
                user_data.avatar_key,

                current_stats.total_xp,
                current_stats.current_streak,

                (
                    SELECT
                        COUNT(*) + 1

                    FROM user_stats AS other_stats

                    WHERE
                        other_stats.total_xp
                            > current_stats.total_xp

                        OR (
                            other_stats.total_xp
                                = current_stats.total_xp

                            AND other_stats.user_id
                                < current_stats.user_id
                        )
                )::INTEGER AS rank

            FROM user_stats AS current_stats

            INNER JOIN users AS user_data
                ON user_data.id =
                    current_stats.user_id

            WHERE
                current_stats.user_id = $1
            """,
            user_id,
        )