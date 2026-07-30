import asyncpg

from database.database import get_connection


async def update_user(
    telegram_id: int,
    username: str | None,
    first_name: str | None,
) -> asyncpg.Record:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            UPDATE users
            SET
                username = $2,
                first_name = $3,
                updated_at = NOW()
            WHERE telegram_id = $1
            RETURNING
                id,
                telegram_id,
                username,
                first_name,
                created_at,
                updated_at
            """,
            telegram_id,
            username,
            first_name,
        )