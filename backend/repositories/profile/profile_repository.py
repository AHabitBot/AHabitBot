from typing import Any

from backend.database.database import get_connection


# =========================================================
# PROFILE REPOSITORY
# =========================================================


async def get_profile_data(
    user_id: int,
) -> dict[str, Any] | None:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            SELECT
                u.nickname,
                u.nickname_changed_at,
                u.avatar_key,
                u.background_key,
                COALESCE(us.total_xp, 0) AS total_xp,
                COALESCE(us.highest_level_reached, 1) AS highest_level_reached
            FROM users AS u
            LEFT JOIN user_stats AS us
                ON us.user_id = u.id
            WHERE u.id = $1
            LIMIT 1
            """,
            user_id,
        )

    if row is None:
        return None

    return dict(row)



async def update_nickname_once(
    user_id: int,
    nickname: str,
) -> dict | None:
    """
    Меняет nickname только в том случае,
    если пользователь ещё не использовал
    единственную смену nickname.

    Возвращает обновлённого пользователя
    или None, если смена уже была использована.
    """

    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            UPDATE users
            SET
                nickname = $1,
                nickname_changed_at = NOW(),
                updated_at = NOW()
            WHERE id = $2
              AND nickname_changed_at IS NULL
            RETURNING
                nickname,
                nickname_changed_at
            """,
            nickname,
            user_id,
        )

    if row is None:
        return None

    return dict(row)



# =========================================================
# ОБНОВИТЬ ВНЕШНИЙ ВИД
# =========================================================

async def update_profile_appearance(
    user_id: int,
    avatar_key: str,
    background_key: str,
) -> dict | None:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            UPDATE users
            SET
                avatar_key = $1,
                background_key = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING
                avatar_key,
                background_key
            """,
            avatar_key,
            background_key,
            user_id,
        )

    if row is None:
        return None

    return dict(row)

# =========================================================
# LEVEL PROGRESSION
# =========================================================

async def get_level_progression_state(
    user_id: int,
) -> dict[str, Any] | None:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            SELECT
                u.telegram_id,
                COALESCE(settings.language, 'ru') AS language,
                COALESCE(us.total_xp, 0) AS total_xp,
                COALESCE(
                    us.highest_level_reached,
                    1
                ) AS highest_level_reached
            FROM users AS u
            LEFT JOIN user_stats AS us
                ON us.user_id = u.id
            LEFT JOIN user_settings AS settings
                ON settings.user_id = u.id
            WHERE u.id = $1
            LIMIT 1
            """,
            user_id,
        )

    if row is None:
        return None

    return dict(row)


async def mark_highest_level_reached(
    user_id: int,
    new_level: int,
) -> bool:
    """
    Поднимает highest_level_reached только вверх.

    WHERE highest_level_reached < new_level делает операцию
    идемпотентной и защищает от дублей уведомлений.
    """

    async with get_connection() as connection:
        result = await connection.fetchval(
            """
            UPDATE user_stats
            SET
                highest_level_reached = $2,
                updated_at = NOW()
            WHERE user_id = $1
              AND highest_level_reached < $2
            RETURNING highest_level_reached
            """,
            user_id,
            max(1, int(new_level)),
        )

    return result is not None
