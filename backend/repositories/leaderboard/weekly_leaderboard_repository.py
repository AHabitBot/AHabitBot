"""Current weekly standings, scoped to the requesting user's league."""
from datetime import datetime

from backend.database.database import get_connection
from backend.services.leaderboard.league_activity import ACTIVE_HABIT_USERS_CTE
from backend.services.leaderboard.league_transition_service import transition_count, _bounds, KYIV


async def get_weekly_leaderboard(week_start, user_id: int, limit: int = 100) -> dict:
    safe_limit = max(1, min(int(limit), 100))
    start, end = _bounds(week_start)
    now = datetime.now(KYIV)
    cutoff = min(now, end)
    # For finished weeks, cancellations after the freeze do not alter activity.
    historical = now >= end
    async with get_connection() as connection:
        league = await connection.fetchval(
            "SELECT league_level FROM users WHERE id = $1", user_id
        )
        if league is None:
            return {"users": [], "current_user": None, "zones": {"active_count": 0, "promotion_count": 0, "demotion_count": 0}}
        activation_week = await connection.fetchval(
            "SELECT league_activation_week FROM weekly_competition_config WHERE id=1"
        )
        transitions_enabled = activation_week is not None and week_start >= activation_week
        # Shared active_users CTE is also used by the weekly freeze service.
        # The $3 flag preserves activity as of the Sunday cutoff for past weeks.
        active_cte = ACTIVE_HABIT_USERS_CTE
        active_count = await connection.fetchval(
            f"""WITH {active_cte}
            SELECT COUNT(*) FROM active_users a
            JOIN users u ON u.id=a.user_id
            WHERE u.league_level=$4""",
            start, cutoff, historical, league,
        )
        rows = await connection.fetch(
            f"""WITH {active_cte}
            SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(w.weekly_xp, 0) DESC, a.user_id ASC)::INTEGER AS rank,
                   u.id AS user_id, u.nickname, u.avatar_key, u.status_emoji,
                   u.league_level, COALESCE(w.weekly_xp, 0)::INTEGER AS weekly_xp, s.current_streak
            FROM active_users a
            JOIN users u ON u.id = a.user_id
            LEFT JOIN user_weekly_xp w ON w.user_id = a.user_id AND w.week_start=$4
            JOIN user_stats s ON s.user_id = a.user_id
            WHERE u.league_level=$5
            ORDER BY weekly_xp DESC, a.user_id ASC
            LIMIT $6
            """, start, cutoff, historical, week_start, league, safe_limit,
        )
        own = await connection.fetchrow(
            f"""WITH {active_cte},
            me AS (
                SELECT u.id AS user_id, u.nickname, u.avatar_key, u.status_emoji,
                       u.league_level, COALESCE(w.weekly_xp, 0)::INTEGER AS weekly_xp,
                       s.current_streak, (a.user_id IS NOT NULL) AS active
                FROM users u
                JOIN user_stats s ON s.user_id=u.id
                LEFT JOIN user_weekly_xp w ON w.user_id=u.id AND w.week_start=$4
                LEFT JOIN active_users a ON a.user_id=u.id
                WHERE u.id=$5
            )
            SELECT me.user_id, me.nickname, me.avatar_key, me.status_emoji,
                   me.league_level, me.weekly_xp, me.current_streak,
                   CASE WHEN NOT me.active THEN NULL ELSE
                       (SELECT COUNT(*) + 1 FROM active_users a
                        JOIN users participant ON participant.id=a.user_id
                        LEFT JOIN user_weekly_xp other ON other.user_id=a.user_id AND other.week_start=$4
                        WHERE participant.league_level=me.league_level
                          AND (COALESCE(other.weekly_xp, 0) > me.weekly_xp OR
                               (COALESCE(other.weekly_xp, 0) = me.weekly_xp AND a.user_id < me.user_id)))::INTEGER
                   END AS rank
            FROM me
            """, start, cutoff, historical, week_start, user_id,
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
