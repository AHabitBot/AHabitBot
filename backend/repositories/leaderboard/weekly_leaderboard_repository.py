"""Read the current week's leaderboard without season/snapshot dependencies."""
from backend.database.database import get_connection


async def get_weekly_leaderboard(week_start, user_id: int, limit: int = 100) -> dict:
    safe_limit = max(1, min(int(limit), 100))
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT ROW_NUMBER() OVER (ORDER BY w.weekly_xp DESC, w.user_id ASC)::INTEGER AS rank,
                   u.id AS user_id, u.nickname, u.avatar_key,
                   w.weekly_xp::INTEGER AS weekly_xp, s.current_streak
            FROM user_weekly_xp w
            JOIN users u ON u.id = w.user_id
            JOIN user_stats s ON s.user_id = w.user_id
            WHERE w.week_start = $1 AND w.weekly_xp > 0
            ORDER BY w.weekly_xp DESC, w.user_id ASC
            LIMIT $2
            """, week_start, safe_limit,
        )
        own = await connection.fetchrow(
            """
            WITH me AS (
                SELECT u.id AS user_id, u.nickname, u.avatar_key,
                       COALESCE(w.weekly_xp, 0)::INTEGER AS weekly_xp,
                       s.current_streak
                FROM users u
                JOIN user_stats s ON s.user_id = u.id
                LEFT JOIN user_weekly_xp w ON w.user_id = u.id AND w.week_start = $1
                WHERE u.id = $2
            )
            SELECT me.*,
                   CASE WHEN me.weekly_xp = 0 THEN NULL ELSE
                       (SELECT COUNT(*) + 1 FROM user_weekly_xp other
                        WHERE other.week_start = $1 AND other.weekly_xp > 0
                          AND (other.weekly_xp > me.weekly_xp OR
                               (other.weekly_xp = me.weekly_xp AND other.user_id < me.user_id)))::INTEGER
                   END AS rank
            FROM me
            """, week_start, user_id,
        )
    return {"users": [dict(row) for row in rows], "current_user": dict(own) if own else None}
