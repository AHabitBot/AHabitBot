import asyncio

import asyncpg

from .database import DATABASE_URL


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    nickname VARCHAR(32) NOT NULL UNIQUE,
    avatar_key VARCHAR(64) NOT NULL DEFAULT 'beginer_m',
    first_name VARCHAR(255),
    nickname VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Kyiv',
    language VARCHAR(10) NOT NULL DEFAULT 'ru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '✱',
    color VARCHAR(64) NOT NULL,
    size VARCHAR(32) NOT NULL DEFAULT 'large',
    xp_reward INTEGER NOT NULL DEFAULT 5 CHECK (xp_reward >= 0),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_habits_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_confirmations (
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL,
    confirmation_date DATE NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    xp_awarded BOOLEAN NOT NULL DEFAULT TRUE,
    xp_amount INTEGER NOT NULL DEFAULT 5 CHECK (xp_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_confirmations_habit
        FOREIGN KEY (habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_habit_confirmation_date
        UNIQUE (habit_id, confirmation_date),

    CONSTRAINT chk_confirmation_xp_state
        CHECK (NOT xp_awarded OR is_confirmed)
);

CREATE TABLE IF NOT EXISTS user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    max_streak INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
    total_confirmations INTEGER NOT NULL DEFAULT 0 CHECK (total_confirmations >= 0),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_stats_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_max_streak
        CHECK (max_streak >= current_streak)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id
    ON habits(user_id);

CREATE INDEX IF NOT EXISTS idx_habits_user_active
    ON habits(user_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_confirmations_habit_id
    ON habit_confirmations(habit_id);

CREATE INDEX IF NOT EXISTS idx_confirmations_date
    ON habit_confirmations(confirmation_date);

CREATE INDEX IF NOT EXISTS idx_confirmations_habit_confirmed
    ON habit_confirmations(habit_id, is_confirmed);

CREATE INDEX IF NOT EXISTS idx_user_settings_user
    ON user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_global_leaderboard
    ON user_stats (
        total_xp DESC,
        user_id ASC
    );
"""


async def init_database() -> None:
    print("🔄 Подключение к PostgreSQL...")

    connection = await asyncpg.connect(DATABASE_URL)

    try:
        async with connection.transaction():
            await connection.execute(CREATE_TABLES_SQL)

        print("✅ Таблицы успешно созданы:")
        print("   • users")
        print("   • habits")
        print("   • habit_confirmations")
        print("   • user_stats")

    finally:
        await connection.close()


if __name__ == "__main__":
    try:
        asyncio.run(init_database())
    except Exception as error:
        print(f"❌ Ошибка инициализации базы данных: {error}")
        raise