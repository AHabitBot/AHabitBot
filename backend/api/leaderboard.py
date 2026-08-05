from backend.api.dependencies import (
    CurrentUser,
)
from backend.repositories.leaderboard.leaderboard_components import (
    get_global_current_user,
    get_global_leaderboard_users,
)
from fastapi import APIRouter


router = APIRouter(
    prefix="/api/leaderboard",
    tags=["leaderboard"],
)


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