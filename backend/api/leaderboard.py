from fastapi import APIRouter

from backend.api.dependencies import CurrentUser
from backend.services.leaderboard.weekly_leaderboard_service import build_weekly_leaderboard

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("/week")
async def read_weekly_leaderboard(user: CurrentUser):
    return await build_weekly_leaderboard(int(user["id"]))
