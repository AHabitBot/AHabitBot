import asyncpg

from database.database import get_connection


async def create_user(
    telegram_id: int,
    username: str | None,
    first_name: str | None,
) -> asyncpg.Record:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            INSERT INTO users (
                telegram_id,
                username,
                first_name
            )
            VALUES ($1, $2, $3)
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