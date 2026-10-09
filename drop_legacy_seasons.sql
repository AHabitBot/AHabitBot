-- Stage 5.6: DESTRUCTIVE. Take a verified pg_dump backup first.
-- Run only after deploying updated backend and init_pg_db.py.
-- No CASCADE: unexpected dependencies cause an error and rollback.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DROP TABLE IF EXISTS public.leaderboard_rank_snapshots RESTRICT;
DROP TABLE IF EXISTS public.season_results RESTRICT;
DROP TABLE IF EXISTS public.user_season_stats RESTRICT;
COMMIT;
