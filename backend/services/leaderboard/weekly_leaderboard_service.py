"""Single response builder shared by the weekly API and bootstrap."""
from backend.repositories.leaderboard.weekly_leaderboard_repository import get_weekly_leaderboard
from datetime import datetime
from backend.services.leaderboard.week_service import WEEK_TIMEZONE, get_week_bounds


async def build_weekly_leaderboard(user_id: int) -> dict:
    now = datetime.now(WEEK_TIMEZONE)
    start, end = get_week_bounds(now)
    week_start = start.date()
    data = await get_weekly_leaderboard(week_start, user_id)
    return {
        "week": {"start_date": start.isoformat(), "end_date": end.isoformat(),
                 "week_start": week_start.isoformat()},
        **data,
    }
