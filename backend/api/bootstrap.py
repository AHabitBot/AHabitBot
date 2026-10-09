import asyncio
from fastapi import APIRouter, HTTPException, status

from backend.api.dependencies import CurrentUser
from backend.repositories.habits import get_user_habits
from backend.repositories.referral import get_referral_stats
from backend.repositories.settings import get_user_settings
from backend.services.achievements.achievements_service import get_achievements
from backend.services.leaderboard.weekly_leaderboard_service import build_weekly_leaderboard
from backend.services.profile import get_profile
from backend.services.stats import get_profile_stats

router = APIRouter(prefix="/api/bootstrap", tags=["bootstrap"])


@router.get("")
async def read_bootstrap(user: CurrentUser):
    user_id = int(user["id"])

    (
        habits,
        weekly_leaderboard,
        week_stats,
        month_stats,
        year_stats,
        achievements,
        referral_stats,
        settings,
    ) = await asyncio.gather(
        get_user_habits(user_id),
        build_weekly_leaderboard(user_id),
        get_profile_stats(user_id=user_id, period="week"),
        get_profile_stats(user_id=user_id, period="month"),
        get_profile_stats(user_id=user_id, period="year"),
        get_achievements(user_id=user_id),
        get_referral_stats(inviter_user_id=user_id),
        get_user_settings(user_id=user_id),
    )

    profile = await get_profile(user_id=user_id, achievements_data=achievements)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль пользователя не найден",
        )

    return {
        "habits": habits,
        "profile": profile,
        "weekly_leaderboard": weekly_leaderboard,
        "stats": {
            "week": week_stats,
            "month": month_stats,
            "year": year_stats,
        },
        "achievements": achievements,
        "settings": settings,
        "referral": {
            "referral_link": user["referral_link"],
            "invited_count": int(referral_stats["invited_count"]) if referral_stats else 0,
            "earned_xp": int(referral_stats["earned_xp"]) if referral_stats else 0,
        },
    }
