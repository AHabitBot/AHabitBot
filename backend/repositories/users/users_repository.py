import asyncpg

from backend.database.database import get_connection
from config import BOT_USERNAME


DEFAULT_AVATAR_KEY = "standard_m_01"


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
                nickname,
                referral_link,
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
    referral_link = (
        f"https://t.me/{BOT_USERNAME}"
        f"?start={telegram_id}"
    )

    async with get_connection() as connection:
        async with connection.transaction():
            new_user = await connection.fetchrow(
                """
                INSERT INTO users (
                    telegram_id,
                    username,
                    first_name,
                    referral_link,
                    avatar_key
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                telegram_id,
                username,
                first_name,
                referral_link,
                DEFAULT_AVATAR_KEY,
            )

            if new_user is None:
                raise RuntimeError(
                    "Не удалось создать пользователя"
                )

            user_id = new_user["id"]
            nickname = f"Player{user_id}"

            await connection.execute(
                """
                INSERT INTO user_settings (
                    user_id,
                    timezone,
                    language
                )
                VALUES (
                    $1,
                    'Europe/Kyiv',
                    'ru'
                )
                """,
                user_id,
            )

            await connection.execute(
                """
                INSERT INTO user_stats (
                    user_id
                )
                VALUES ($1)
                """,
                user_id,
            )

            user = await connection.fetchrow(
                """
                UPDATE users
                SET
                    nickname = $2,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING
                    id,
                    telegram_id,
                    username,
                    first_name,
                    nickname,
                    referral_link,
                    created_at,
                    updated_at
                """,
                user_id,
                nickname,
            )

            if user is None:
                raise RuntimeError(
                    "Не удалось завершить регистрацию пользователя"
                )

            return user


# ============================================================================
# Обновление пользователей
# ============================================================================

async def update_user(
    telegram_id: int,
    username: str | None,
    first_name: str | None,
) -> asyncpg.Record | None:
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
                nickname,
                referral_link,
                created_at,
                updated_at
            """,
            telegram_id,
            username,
            first_name,
        )