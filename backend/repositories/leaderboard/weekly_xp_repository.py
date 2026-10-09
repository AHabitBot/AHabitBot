"""Recompute weekly XP from awards, respecting the one-time launch timestamp."""
from datetime import datetime
from backend.services.leaderboard.week_service import get_week_bounds, WEEK_TIMEZONE


async def refresh_user_weekly_xp(connection, user_id: int, *, at: datetime | None = None) -> int:
    """Refresh the competition containing `at` (defaults to now).

    Caller must already be inside a transaction. A canceled award may require
    refreshing the week in which it was originally awarded.
    """
    start, end = get_week_bounds(at)
    await connection.execute("SELECT pg_advisory_xact_lock($1)", int(user_id))
    launched_at = await connection.fetchval(
        "SELECT launched_at FROM weekly_competition_config WHERE id = 1"
    )
    if launched_at is None:
        raise RuntimeError("Weekly competition not initialized: run updated init_pg_db.py")
    # No score can exist for a competition entirely before launch.
    if end <= launched_at:
        return 0
    effective_start = max(start, launched_at)
    score = await connection.fetchval(
        """
        SELECT (
            COALESCE((
                SELECT SUM(hc.xp_amount)
                FROM habit_confirmations hc
                JOIN habits h ON h.id = hc.habit_id
                WHERE h.user_id = $1 AND hc.is_confirmed AND hc.xp_awarded
                  AND hc.xp_awarded_at >= $2 AND hc.xp_awarded_at < $3
            ), 0)
            + COALESCE((
                SELECT SUM(r.xp_amount) FROM referrals r
                WHERE r.inviter_user_id = $1 AND r.xp_awarded
                  AND r.created_at >= $2 AND r.created_at < $3
            ), 0)
            + COALESCE((
                SELECT SUM(ua.xp_amount) FROM user_achievements ua
                WHERE ua.user_id = $1 AND ua.xp_awarded
                  AND ua.earned_at >= $2 AND ua.earned_at < $3
            ), 0)
        )::INTEGER
        """, user_id, effective_start, end,
    )
    score = max(0, int(score or 0))
    await connection.execute(
        """
        INSERT INTO user_weekly_xp (user_id, week_start, weekly_xp)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp, updated_at = NOW()
        """, user_id, start.date(), score,
    )
    return score
