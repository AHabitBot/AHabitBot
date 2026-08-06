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
# ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ И ЕГО МЕСТО ГЛОБАЛЬНО
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


# =========================================================
# ПОЛУЧИТЬ ТОП-100 СЕЗОННОГО РЕЙТИНГА
# =========================================================

async def get_season_leaderboard_users(
    season_number: int,
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
                        season_stats.season_xp DESC,
                        season_stats.user_id ASC
                )::INTEGER AS rank,

                users.id AS user_id,
                users.nickname,
                users.avatar_key,

                season_stats.season_xp::INTEGER
                    AS season_xp,

                global_stats.current_streak

            FROM user_season_stats AS season_stats

            INNER JOIN users
                ON users.id = season_stats.user_id

            INNER JOIN user_stats AS global_stats
                ON global_stats.user_id =
                    season_stats.user_id

            WHERE
                season_stats.season_number = $1

                AND season_stats.season_xp > 0

            ORDER BY
                season_stats.season_xp DESC,
                season_stats.user_id ASC

            LIMIT $2
            """,
            season_number,
            safe_limit,
        )

# =========================================================
# ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
# В СЕЗОННОМ РЕЙТИНГЕ
# =========================================================

async def get_season_current_user(
    season_number: int,
    user_id: int,
) -> asyncpg.Record | None:

    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            SELECT
                users.id AS user_id,
                users.nickname,
                users.avatar_key,

                COALESCE(
                    season_stats.season_xp,
                    0
                )::INTEGER AS season_xp,

                global_stats.current_streak,

                (
                    SELECT
                        COUNT(*) + 1

                    FROM users AS other_users

                    INNER JOIN user_stats
                        AS other_global_stats
                        ON other_global_stats.user_id =
                            other_users.id

                    LEFT JOIN user_season_stats
                        AS other_season_stats
                        ON other_season_stats.user_id =
                            other_users.id

                       AND other_season_stats.season_number =
                            $1

                    WHERE

                        COALESCE(
                            other_season_stats.season_xp,
                            0
                        )

                        >

                        COALESCE(
                            season_stats.season_xp,
                            0
                        )

                        OR (

                            COALESCE(
                                other_season_stats.season_xp,
                                0
                            )

                            =

                            COALESCE(
                                season_stats.season_xp,
                                0
                            )

                            AND

                            other_users.id
                                < users.id
                        )

                )::INTEGER AS rank

            FROM users

            INNER JOIN user_stats
                AS global_stats
                ON global_stats.user_id =
                    users.id

            LEFT JOIN user_season_stats
                AS season_stats
                ON season_stats.user_id =
                    users.id

               AND season_stats.season_number =
                    $1

            WHERE
                users.id = $2
            """,
            season_number,
            user_id,
        )