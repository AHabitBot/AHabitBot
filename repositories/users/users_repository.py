import asyncpg

from database.database import get_connection


# ============================================================================
# Получение пользователей
# ============================================================================

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


# ============================================================================
# Создание пользователей
# ============================================================================

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


# ============================================================================
# Обновление пользователей
# ============================================================================

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