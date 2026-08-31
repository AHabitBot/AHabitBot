from fastapi import APIRouter

from backend.api.dependencies import (
    CurrentUser,
)
from backend.repositories.leaderboard.leaderboard_components import (
    get_global_current_user,
    get_global_leaderboard_users,
    get_season_current_user,
    get_season_leaderboard_users,
)
from backend.services.leaderboard.season_service import (
    get_season_context,
)
from backend.services.leaderboard.season_results_service import ensure_and_get_finished_season


router = APIRouter(
    prefix="/api/leaderboard",
    tags=["leaderboard"],
)


# =========================================================
# ГЛОБАЛЬНЫЙ РЕЙТИНГ
# =========================================================

@router.get("/global")
async def read_global_leaderboard(
    user: CurrentUser,
):
    leaderboard_users = (
        await get_global_leaderboard_users()
    )

    current_user = (
        await get_global_current_user(
            user["id"]
        )
    )

    return {
        "users": [
            dict(leaderboard_user)
            for leaderboard_user
            in leaderboard_users
        ],

        "current_user": (
            dict(current_user)
            if current_user is not None
            else None
        ),
    }


# =========================================================
# СЕЗОННЫЙ РЕЙТИНГ
# =========================================================

@router.get("/season")
async def read_season_leaderboard(
    user: CurrentUser,
):
    season_context = get_season_context()
    season_number = season_context.number
    season_start_date = season_context.start_date
    season_end_date = season_context.end_date

    if season_context.status == "finished":
        return await ensure_and_get_finished_season(season_number, int(user["id"]))

    leaderboard_users = (
        await get_season_leaderboard_users(
            season_number
        )
    )

    current_user = (
        await get_season_current_user(
            season_number,
            user["id"],
        )
    )

    return {
        "season": {
            "number": season_number,
            "status": "active",

            "start_date":
                season_start_date.isoformat(),

            "end_date":
                season_end_date.isoformat(),
        },

        "users": [
            dict(leaderboard_user)
            for leaderboard_user
            in leaderboard_users
        ],

        "current_user": (
            dict(current_user)
            if current_user is not None
            else None
        ),
    }