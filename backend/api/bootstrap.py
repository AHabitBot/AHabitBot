import asyncio
from fastapi import APIRouter, HTTPException, status

from backend.api.dependencies import CurrentUser
from backend.repositories.habits import get_user_habits
from backend.repositories.leaderboard.leaderboard_components import (
    get_global_current_user,
    get_global_leaderboard_users,
    get_season_current_user,
    get_season_leaderboard_users,
)
from backend.repositories.referral import get_referral_stats
from backend.repositories.settings import get_user_settings
from backend.services.achievements.achievements_service import get_achievements
from backend.services.leaderboard.season_service import (
    get_season_context,
)
from backend.services.leaderboard.season_results_service import ensure_and_get_finished_season
from backend.services.profile import get_profile
from backend.services.stats import (
    get_profile_season_history,
    get_profile_stats,
)


router = APIRouter(
    prefix="/api/bootstrap",
    tags=["bootstrap"],
)


async def _get_global_leaderboard(user_id: int) -> dict:
    users, current_user = await asyncio.gather(
        get_global_leaderboard_users(),
        get_global_current_user(user_id),
    )

    return {
        "users": [dict(item) for item in users],
        "current_user": dict(current_user) if current_user is not None else None,
    }


async def _get_season_leaderboard(user_id: int) -> dict:
    season_context = get_season_context()
    season_number = season_context.number
    season_start_date = season_context.start_date
    season_end_date = season_context.end_date

    if season_context.status == "finished":
        try:
            return await ensure_and_get_finished_season(season_number, user_id)
        except Exception as error:
            # Fail-safe: bootstrap must never fail because the results screen failed.
            print(f"Season results bootstrap fallback: {error}")
            from backend.services.leaderboard.season_service import (
                get_next_season, get_season_ranking_end_date,
            )
            next_number, next_start, next_end = get_next_season(season_number)
            return {
                "season": {
                    "number": season_number, "status": "finished",
                    "start_date": season_start_date.isoformat(),
                    "ranking_end_date": get_season_ranking_end_date(season_number).isoformat(),
                    "end_date": season_end_date.isoformat(),
                },
                "current_user": None, "top3": [],
                "summary": {
                    "participants": 0,
                    "confirmations": 0,
                    "best_streak": 0,
                    "best_streak_user": None,
                    "popular_habit": None,
                    "popular_habit_user": None,
                },
                "next_season": {"number": next_number, "start_date": next_start.isoformat(), "end_date": next_end.isoformat()},
            }

    users, current_user = await asyncio.gather(
        get_season_leaderboard_users(season_number),
        get_season_current_user(season_number, user_id),
    )

    return {
        "season": {
            "number": season_number,
            "status": "active",
            "start_date": season_start_date.isoformat(),
            "end_date": season_end_date.isoformat(),
        },
        "users": [dict(item) for item in users],
        "current_user": dict(current_user) if current_user is not None else None,
    }


@router.get("")
async def read_bootstrap(user: CurrentUser):
    user_id = int(user["id"])

    habits_task = asyncio.create_task(get_user_habits(user_id))
    global_task = asyncio.create_task(_get_global_leaderboard(user_id))
    season_task = asyncio.create_task(_get_season_leaderboard(user_id))
    week_task = asyncio.create_task(get_profile_stats(user_id=user_id, period="week"))
    month_task = asyncio.create_task(get_profile_stats(user_id=user_id, period="month"))
    year_task = asyncio.create_task(get_profile_stats(user_id=user_id, period="year"))
    achievements_task = asyncio.create_task(get_achievements(user_id=user_id))
    referral_task = asyncio.create_task(get_referral_stats(inviter_user_id=user_id))
    settings_task = asyncio.create_task(get_user_settings(user_id=user_id))

    (
        habits,
        global_leaderboard,
        season_leaderboard,
        week_stats,
        month_stats,
        year_stats,
        achievements,
        referral_stats,
        settings,
    ) = await asyncio.gather(
        habits_task,
        global_task,
        season_task,
        week_task,
        month_task,
        year_task,
        achievements_task,
        referral_task,
        settings_task,
    )

    # The season task is intentionally completed before history is read.
    # On the first request of results week this guarantees that season_results
    # has already been finalized before Profile -> Season History queries it.
    try:
        season_history = await get_profile_season_history(user_id=user_id)
    except Exception as error:
        # History is supplementary data and must never block Mini App startup.
        print(f"Season history bootstrap fallback: {error}")
        season_history = []

    profile = await get_profile(
        user_id=user_id,
        achievements_data=achievements,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль пользователя не найден",
        )

    return {
        "habits": habits,
        "profile": profile,
        "leaderboard": {
            "global": global_leaderboard,
            "season": season_leaderboard,
        },
        "stats": {
            "week": week_stats,
            "month": month_stats,
            "year": year_stats,
            "seasons": season_history,
        },
        "achievements": achievements,
        "settings": settings,
        "referral": {
            "referral_link": user["referral_link"],
            "invited_count": int(referral_stats["invited_count"]) if referral_stats else 0,
            "earned_xp": int(referral_stats["earned_xp"]) if referral_stats else 0,
        },
    }
