"""Общий транзакционный замок для начислений XP и закрытия лиг."""
LEAGUE_LOCK = 8400172301

async def lock_league_week(connection):
    await connection.execute("SELECT pg_advisory_xact_lock($1)", LEAGUE_LOCK)
