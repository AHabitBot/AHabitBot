"""Shared definition of an active weekly league participant.

An active participant has at least one non-revoked habit XP award within
Monday 00:01 (inclusive) and Sunday 23:00 (exclusive), Kyiv time.
"""

ACTIVE_HABIT_USERS_CTE = """
active_users AS (
    SELECT DISTINCT user_id
    FROM league_habit_xp_events
    WHERE awarded_at >= $1 AND awarded_at < $2
      AND (revoked_at IS NULL OR ($3::BOOLEAN AND revoked_at >= $2))
)
"""
