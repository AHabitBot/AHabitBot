"""Single response builder shared by the weekly API and bootstrap."""
from backend.repositories.leaderboard.weekly_leaderboard_repository import get_weekly_leaderboard
from datetime import datetime
from backend.services.leaderboard.week_service import WEEK_TIMEZONE, get_competition_bounds


async def build_weekly_leaderboard(user_id: int) -> dict:
    now = datetime.now(WEEK_TIMEZONE)
    start, end = get_competition_bounds(now)
    week_start = start.date()
    data = await get_weekly_leaderboard(week_start, user_id)
    return {
        "league_level": int((data.get("current_user") or {}).get("league_level") or 1),
        "week": {"start_date": start.isoformat(), "end_date": end.isoformat(),
                 "week_start": week_start.isoformat()},
        **data,
    }
