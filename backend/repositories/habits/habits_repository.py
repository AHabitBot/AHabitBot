from typing import Any

from backend.database.database import get_connection


# =========================================================
# ПОЛУЧИТЬ ПРИВЫЧКИ ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def get_user_habits(
    user_id: int,
) -> list[dict[str, Any]]:
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                id,
                user_id,
                title,
                emoji,
                color,
                size,
                xp_reward,
                is_archived,
                created_at,
                updated_at
            FROM habits
            WHERE user_id = $1
              AND is_archived = FALSE
            ORDER BY created_at ASC, id ASC
            """,
            user_id,
        )

    return [
        dict(row)
        for row in rows
    ]


# =========================================================
# СОЗДАТЬ ПРИВЫЧКУ
# =========================================================

async def create_habit(
    user_id: int,
    title: str,
    emoji: str,
    color: str,
    size: str,
) -> dict[str, Any]:
    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO habits (
                user_id,
                title,
                emoji,
                color,
                size
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                user_id,
                title,
                emoji,
                color,
                size,
                xp_reward,
                is_archived,
                created_at,
                updated_at
            """,
            user_id,
            title,
            emoji,
            color,
            size,
        )

    if row is None:
        raise RuntimeError(
            "Не удалось создать привычку"
        )

    return dict(row)