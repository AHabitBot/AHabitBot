BEGIN;

ALTER TABLE habits
    ADD COLUMN IF NOT EXISTS repeat_type TEXT NOT NULL DEFAULT 'days',
    ADD COLUMN IF NOT EXISTS repeat_days SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7]::SMALLINT[],
    ADD COLUMN IF NOT EXISTS weekly_target SMALLINT,
    ADD COLUMN IF NOT EXISTS challenge_target INTEGER,
    ADD COLUMN IF NOT EXISTS repeat_started_on DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_repeat_rule_check;
ALTER TABLE habits ADD CONSTRAINT habits_repeat_rule_check CHECK (
    (repeat_type = 'days'
        AND cardinality(repeat_days) BETWEEN 1 AND 7
        AND repeat_days <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
        AND weekly_target IS NULL
        AND challenge_target IS NULL)
    OR
    (repeat_type = 'weekly'
        AND cardinality(repeat_days) = 0
        AND weekly_target BETWEEN 1 AND 7
        AND challenge_target IS NULL)
    OR
    (repeat_type = 'challenge'
        AND cardinality(repeat_days) = 0
        AND weekly_target IS NULL
        AND challenge_target > 0)
);

COMMIT;
