import asyncio

import asyncpg

from backend.database.database import DATABASE_URL


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    nickname VARCHAR(32) UNIQUE,
    nickname_changed_at TIMESTAMPTZ,
    avatar_key VARCHAR(64) NOT NULL DEFAULT 'standard_m_01',
    background_key VARCHAR(64) NOT NULL DEFAULT 'background_forest_1',
    first_name VARCHAR(255),
    username VARCHAR(255),
    referral_link VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- Гарантируем правильный default и для уже существующей таблицы users.
-- CREATE TABLE IF NOT EXISTS не меняет DEFAULT у ранее созданной колонки.
ALTER TABLE users
    ALTER COLUMN avatar_key
    SET DEFAULT 'standard_m_01';

-- Исправляем только известные устаревшие значения,
-- не затрагивая выбранные пользователями валидные аватары.
UPDATE users
SET
    avatar_key = 'standard_m_01',
    updated_at = NOW()
WHERE avatar_key IN ('beginer_m', 'beginner_m');



CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Kyiv',
    language VARCHAR(10) NOT NULL DEFAULT 'ru',
    theme VARCHAR(10) NOT NULL DEFAULT 'light',
    reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_reminder_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS theme
    VARCHAR(10) NOT NULL DEFAULT 'light';

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS reminders_enabled
    BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS last_reminder_date
    DATE;

CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    emoji VARCHAR(32) NOT NULL DEFAULT '✱',
    color VARCHAR(64) NOT NULL,
    size VARCHAR(32) NOT NULL DEFAULT 'large',
    xp_reward INTEGER NOT NULL DEFAULT 5 CHECK (xp_reward >= 0),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_habits_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

ALTER TABLE habits
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

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


CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,

    inviter_user_id BIGINT NOT NULL,
    invited_user_id BIGINT NOT NULL UNIQUE,

    xp_awarded BOOLEAN NOT NULL DEFAULT TRUE,
    xp_amount INTEGER NOT NULL DEFAULT 5 CHECK (xp_amount >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_referrals_inviter
        FOREIGN KEY (inviter_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_referrals_invited
        FOREIGN KEY (invited_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_referrals_not_self
        CHECK (inviter_user_id <> invited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter_user_id
    ON referrals(inviter_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_created_at
    ON referrals(created_at);


CREATE TABLE IF NOT EXISTS user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    max_streak INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
    total_confirmations INTEGER NOT NULL DEFAULT 0 CHECK (total_confirmations >= 0),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    highest_level_reached INTEGER NOT NULL DEFAULT 1 CHECK (highest_level_reached >= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_stats_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_max_streak
        CHECK (max_streak >= current_streak)
);

ALTER TABLE user_stats
    ADD COLUMN IF NOT EXISTS highest_level_reached
    INTEGER NOT NULL DEFAULT 1;


CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    achievement_code VARCHAR(64) NOT NULL,

    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    xp_awarded BOOLEAN NOT NULL DEFAULT TRUE,

    xp_amount INTEGER NOT NULL DEFAULT 0
        CHECK (xp_amount >= 0),

    CONSTRAINT fk_user_achievements_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_achievement
        UNIQUE (
            user_id,
            achievement_code
        )
);

CREATE TABLE IF NOT EXISTS user_season_stats (
    season_number INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    season_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        season_number,
        user_id
    ),

    CONSTRAINT fk_user_season_stats_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_season_number_positive
        CHECK (season_number >= 1),

    CONSTRAINT chk_season_xp_non_negative
        CHECK (season_xp >= 0)
);

CREATE INDEX IF NOT EXISTS
idx_user_season_stats_leaderboard
ON user_season_stats (
    season_number,
    season_xp DESC,
    user_id ASC
);


CREATE TABLE IF NOT EXISTS leaderboard_rank_snapshots (
    snapshot_date DATE NOT NULL,
    leaderboard_type VARCHAR(16) NOT NULL,
    season_number INTEGER NOT NULL DEFAULT 0,
    user_id BIGINT NOT NULL,
    rank INTEGER NOT NULL CHECK (rank >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        snapshot_date,
        leaderboard_type,
        season_number,
        user_id
    ),

    CONSTRAINT fk_leaderboard_rank_snapshots_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_leaderboard_rank_snapshot_type
        CHECK (leaderboard_type IN ('global', 'season')),

    CONSTRAINT chk_leaderboard_rank_snapshot_season
        CHECK (
            (leaderboard_type = 'global' AND season_number = 0)
            OR
            (leaderboard_type = 'season' AND season_number >= 1)
        )
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_snapshots_lookup
    ON leaderboard_rank_snapshots (
        leaderboard_type,
        season_number,
        snapshot_date DESC,
        user_id
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

CREATE INDEX IF NOT EXISTS idx_habits_user_archive
    ON habits (
        user_id,
        is_archived,
        archived_at DESC
    );

"""



def _calculate_level_for_migration(total_xp: int) -> int:
    """
    Нужен только для безопасного backfill существующей БД.
    Повторяет текущую формулу level_service:
    level 1 -> 2 = 20 XP, далее +10 XP на каждый уровень.
    """

    remaining_xp = max(0, int(total_xp or 0))
    level = 1

    while True:
        xp_required = (level + 1) * 10

        if remaining_xp < xp_required:
            return level

        remaining_xp -= xp_required
        level += 1


async def _backfill_highest_levels(
    connection: asyncpg.Connection,
) -> None:
    """
    Старым пользователям запоминаем уже достигнутый уровень,
    чтобы после деплоя не отправлять ретро-уведомления.
    Значение никогда не уменьшается.
    """

    rows = await connection.fetch(
        """
        SELECT
            user_id,
            total_xp,
            highest_level_reached
        FROM user_stats
        """
    )

    updates = []

    for row in rows:
        current_level = _calculate_level_for_migration(
            int(row["total_xp"] or 0)
        )
        stored_level = max(
            1,
            int(row["highest_level_reached"] or 1),
        )

        if current_level > stored_level:
            updates.append((
                current_level,
                int(row["user_id"]),
            ))

    if updates:
        await connection.executemany(
            """
            UPDATE user_stats
            SET highest_level_reached = $1
            WHERE user_id = $2
            """,
            updates,
        )


async def init_database() -> None:
    print("🔄 Подключение к PostgreSQL...")

    connection = await asyncpg.connect(DATABASE_URL)

    try:
        async with connection.transaction():
            await connection.execute(CREATE_TABLES_SQL)
            await _backfill_highest_levels(connection)

        print("✅ Таблицы успешно созданы:")
        print("   • users")
        print("   • user_settings")
        print("   • habits")
        print("   • habit_confirmations")
        print("   • referrals")
        print("   • user_achievements")
        print("   • user_stats")
        print("   • user_season_stats")
        print("   • leaderboard_rank_snapshots")

    finally:
        await connection.close()


if __name__ == "__main__":
    try:
        asyncio.run(init_database())
    except Exception as error:
        print(f"❌ Ошибка инициализации базы данных: {error}")
        raise