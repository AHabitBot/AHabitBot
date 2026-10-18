"""Persistence and current-week eligibility for leaderboard emoji status."""
from datetime import datetime
from backend.database.database import get_connection
from backend.services.leaderboard.week_service import WEEK_TIMEZONE, get_competition_bounds

async def save_status(user_id: int, emoji: str | None) -> str | None:
    week_start = get_competition_bounds(datetime.now(WEEK_TIMEZONE))[0].date()
    async with get_connection() as connection:
        async with connection.transaction():
            # The weekly XP record, not the visible top-100 page, defines membership.
            eligible = await connection.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM user_weekly_xp
                    WHERE user_id = $1 AND week_start = $2 AND weekly_xp > 0
                )
            """, user_id, week_start)
            if not eligible:
                return _NOT_ELIGIBLE
            return await connection.fetchval("""
                UPDATE users SET status_emoji = $2, updated_at = NOW()
                WHERE id = $1 RETURNING status_emoji
            """, user_id, emoji)

_NOT_ELIGIBLE = object()
