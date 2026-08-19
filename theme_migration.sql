ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS theme VARCHAR(10) NOT NULL DEFAULT 'light';

UPDATE user_settings
SET theme = 'light'
WHERE theme IS NULL OR theme NOT IN ('light', 'dark');
