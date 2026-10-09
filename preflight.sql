-- Read-only preflight. Run this before any destructive migration.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('r','p') AND n.nspname='public'
  AND c.relname IN ('user_season_stats','season_results','leaderboard_rank_snapshots')
ORDER BY c.relname;

-- External foreign keys referencing these tables (must be reviewed):
SELECT con.conname, con.conrelid::regclass AS dependent_table, con.confrelid::regclass AS referenced_table
FROM pg_constraint con
WHERE con.contype='f' AND con.confrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('user_season_stats','season_results','leaderboard_rank_snapshots')
);
