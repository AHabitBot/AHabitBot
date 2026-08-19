from typing import Any

from backend.database.database import get_connection


# =========================================================
# ACHIEVEMENTS REPOSITORY
# =========================================================


# =========================================================
# ПОЛУЧИТЬ ДОСТИЖЕНИЯ ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def get_user_achievements(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Возвращает все уже полученные достижения пользователя.

    Repository отвечает только за получение данных
    из PostgreSQL.

    Логика определения доступных и новых достижений
    находится в achievements_service.py.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                id,
                achievement_code,
                earned_at,
                xp_awarded,
                xp_amount
            FROM user_achievements
            WHERE user_id = $1
            ORDER BY earned_at ASC, id ASC
            """,
            user_id,
        )

    return [
        dict(row)
        for row in rows
    ]


# =========================================================
# ПРОВЕРИТЬ, ПОЛУЧЕНО ЛИ ДОСТИЖЕНИЕ
# =========================================================

async def achievement_exists(
    user_id: int,
    achievement_code: str,
) -> bool:
    """
    Проверяет, есть ли конкретное достижение
    у пользователя.
    """

    async with get_connection() as connection:
        exists = await connection.fetchval(
            """
            SELECT EXISTS (
                SELECT 1
                FROM user_achievements
                WHERE user_id = $1
                  AND achievement_code = $2
            )
            """,
            user_id,
            achievement_code,
        )

    return bool(exists)


# =========================================================
# СОЗДАТЬ ДОСТИЖЕНИЕ
# =========================================================

async def create_user_achievement(
    user_id: int,
    achievement_code: str,
    xp_amount: int,
) -> dict[str, Any] | None:
    """
    Записывает новое достижение пользователя.

    UNIQUE(user_id, achievement_code)
    защищает от повторной выдачи одного достижения.

    Если достижение уже существует,
    возвращает None.
    """

    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO user_achievements (
                user_id,
                achievement_code,
                xp_awarded,
                xp_amount
            )
            VALUES (
                $1,
                $2,
                TRUE,
                $3
            )

            ON CONFLICT (
                user_id,
                achievement_code
            )
            DO NOTHING

            RETURNING
                id,
                user_id,
                achievement_code,
                earned_at,
                xp_awarded,
                xp_amount
            """,
            user_id,
            achievement_code,
            xp_amount,
        )

    if row is None:
        return None

    return dict(row)