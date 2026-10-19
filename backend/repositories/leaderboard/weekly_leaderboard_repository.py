"""Current weekly standings, scoped to the requesting user's league."""
from backend.database.database import get_connection
from backend.services.leaderboard.league_transition_service import transition_count


async def get_weekly_leaderboard(week_start, user_id: int, limit: int = 100) -> dict:
    safe_limit = max(1, min(int(limit), 100))
    async with get_connection() as connection:
        # Determine the league once; all positions and the list use the same value.
        league = await connection.fetchval(
            "SELECT league_level FROM users WHERE id = $1", user_id
        )
        if league is None:
            return {"users": [], "current_user": None, "zones": {"active_count": 0, "promotion_count": 0, "demotion_count": 0}}
        activation_week = await connection.fetchval(
            "SELECT league_activation_week FROM weekly_competition_config WHERE id=1"
        )
        transitions_enabled = activation_week is not None and week_start >= activation_week
        active_count = await connection.fetchval(
            """SELECT COUNT(*) FROM user_weekly_xp w
               JOIN users u ON u.id=w.user_id
               WHERE w.week_start=$1 AND w.weekly_xp>0 AND u.league_level=$2""",
            week_start, league,
        )
        rows = await connection.fetch(
            """
            SELECT ROW_NUMBER() OVER (ORDER BY w.weekly_xp DESC, w.user_id ASC)::INTEGER AS rank,
                   u.id AS user_id, u.nickname, u.avatar_key, u.status_emoji,
                   u.league_level, w.weekly_xp::INTEGER AS weekly_xp, s.current_streak
            FROM user_weekly_xp w
            JOIN users u ON u.id = w.user_id
            JOIN user_stats s ON s.user_id = w.user_id
            WHERE w.week_start = $1 AND w.weekly_xp > 0 AND u.league_level = $2
            ORDER BY w.weekly_xp DESC, w.user_id ASC
            LIMIT $3
            """, week_start, league, safe_limit,
        )
        own = await connection.fetchrow(
            """
            WITH me AS (
                SELECT u.id AS user_id, u.nickname, u.avatar_key, u.status_emoji,
                       u.league_level, COALESCE(w.weekly_xp, 0)::INTEGER AS weekly_xp,
                       s.current_streak
                FROM users u
                JOIN user_stats s ON s.user_id = u.id
                LEFT JOIN user_weekly_xp w ON w.user_id = u.id AND w.week_start = $1
                WHERE u.id = $2
            )
            SELECT me.*,
                   CASE WHEN me.weekly_xp = 0 THEN NULL ELSE
                       (SELECT COUNT(*) + 1 FROM user_weekly_xp other
                        JOIN users participant ON participant.id = other.user_id
                        WHERE other.week_start = $1 AND other.weekly_xp > 0
                          AND participant.league_level = me.league_level
                          AND (other.weekly_xp > me.weekly_xp OR
                               (other.weekly_xp = me.weekly_xp AND other.user_id < me.user_id)))::INTEGER
                   END AS rank
            FROM me
            """, week_start, user_id,
        )
    count = int(active_count or 0)
    quota = transition_count(count) if transitions_enabled else 0
    return {
        "users": [dict(row) for row in rows],
        "current_user": dict(own) if own else None,
        "zones": {
            "active_count": count,
            "transitions_enabled": transitions_enabled,
            "promotion_count": quota if league < 10 else 0,
            "demotion_count": quota if league > 1 else 0,
        },
    }
