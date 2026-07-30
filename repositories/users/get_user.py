import asyncpg

from database.database import get_connection


async def get_user_by_telegram_id(
    telegram_id: int,
) -> asyncpg.Record | None:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            SELECT
                id,
                telegram_id,
                username,
                first_name,
                created_at,
                updated_at
            FROM users
            WHERE telegram_id = $1
            """,
            telegram_id,
        )