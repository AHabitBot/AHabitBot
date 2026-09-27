BEGIN;

-- Новые пользователи, созданные через /start, могут ещё не иметь
-- часового пояса устройства до первого открытия Mini App.
ALTER TABLE user_settings
    ALTER COLUMN timezone DROP NOT NULL,
    ALTER COLUMN timezone DROP DEFAULT;

COMMIT;
