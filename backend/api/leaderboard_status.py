"""Standalone API for leaderboard status selection."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.api.dependencies import CurrentUser
from backend.repositories.leaderboard.leaderboard_status_repository import save_status, _NOT_ELIGIBLE

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard-status"])

ALLOWED_EMOJI = (
    "🔥", "💪", "😎", "🚀", "🏆", "⚡", "🎯", "👑", "🧠", "❤️",
    "🥇", "⭐", "🌟", "💎", "🦁", "🐺", "🐉", "🦊", "🐻", "🐼",
    "😈", "👻", "🤖", "🥷", "🤩", "🥳", "😍", "🤔", "😴", "😂",
    "💯", "🍀", "🌈", "🌙", "☀️", "🌸", "🎮", "🎸", "☕", "🧊",
)

class StatusPayload(BaseModel):
    emoji: str | None = None

@router.put("/status")
async def update_status(payload: StatusPayload, user: CurrentUser):
    if payload.emoji is not None and payload.emoji not in ALLOWED_EMOJI:
        raise HTTPException(status_code=422, detail="Unsupported status emoji")
    value = await save_status(int(user["id"]), payload.emoji)
    if value is _NOT_ELIGIBLE:
        raise HTTPException(status_code=403, detail="Earn weekly XP to change your status")
    return {"status_emoji": value}
