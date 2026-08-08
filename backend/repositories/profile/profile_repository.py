from typing import Any

from backend.database.database import get_connection


# =========================================================
# PROFILE REPOSITORY
# =========================================================


async def get_profile_data(
    user_id: int,
) -> dict[str, Any] | None:
    """
    Возвращает сырые данные профиля пользователя.

    Repository отвечает только за получение данных
    из PostgreSQL.

    Бизнес-логика профиля и расчёт уровня
    находятся в profile_service.py.
    """

    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            SELECT
                u.nickname,
                u.nickname_changed_at,
                u.avatar_key,
                COALESCE(us.total_xp, 0) AS total_xp
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