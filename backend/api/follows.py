"""Социальные подписки: закрытое тестирование для владельца AHabit."""
from fastapi import APIRouter, HTTPException, Query
from backend.api.dependencies import CurrentUser
from backend.database.database import get_connection

router = APIRouter(prefix="/api/follows", tags=["follows"])
TEST_TELEGRAM_ID = 900410719


def require_test_access(user):
    if int(user["telegram_id"]) != TEST_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Функция пока недоступна")


@router.get("/me")
async def my_social_summary(user: CurrentUser):
    """Счётчики текущего пользователя по проверенной Telegram-сессии."""
    return await social_summary(int(user["id"]), user)


@router.get("/users/{profile_id}")
async def social_summary(profile_id: int, user: CurrentUser):
    require_test_access(user)
    async with get_connection() as db:
        exists = await db.fetchval("SELECT 1 FROM users WHERE id=$1", profile_id)
        if not exists:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        row = await db.fetchrow("""
            SELECT
              (SELECT COUNT(*) FROM user_follows WHERE follower_id=$1) AS following_count,
              (SELECT COUNT(*) FROM user_follows WHERE following_id=$1) AS followers_count,
              EXISTS(SELECT 1 FROM user_follows WHERE follower_id=$2 AND following_id=$1) AS is_following
        """, profile_id, user["id"])
    return dict(row)


@router.get("/users/{profile_id}/list")
async def social_list(profile_id: int, user: CurrentUser, kind: str = Query("following", pattern="^(following|followers)$"), limit: int = Query(30, ge=1, le=100), offset: int = Query(0, ge=0)):
    require_test_access(user)
    async with get_connection() as db:
        if not await db.fetchval("SELECT 1 FROM users WHERE id=$1", profile_id):
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        if kind == "following":
            join_on, condition = "u.id = f.following_id", "f.follower_id = $1"
        else:
            join_on, condition = "u.id = f.follower_id", "f.following_id = $1"
        rows = await db.fetch(f"""
            SELECT u.id, u.nickname, u.avatar_key, u.frame_key,
                   COALESCE(s.highest_level_reached, 1) AS level
            FROM user_follows f
            JOIN users u ON {join_on}
            LEFT JOIN user_stats s ON s.user_id = u.id
            WHERE {condition}
            ORDER BY f.created_at DESC, u.id DESC
            LIMIT $2 OFFSET $3
        """, profile_id, limit, offset)
    return {"items": [dict(r) for r in rows], "has_more": len(rows) == limit}


@router.post("/users/{profile_id}")
async def follow(profile_id: int, user: CurrentUser):
    require_test_access(user)
    if profile_id == user["id"]:
        raise HTTPException(status_code=400, detail="Нельзя подписаться на себя")
    async with get_connection() as db:
        if not await db.fetchval("SELECT 1 FROM users WHERE id=$1", profile_id):
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        await db.execute("""
            INSERT INTO user_follows (follower_id, following_id)
            VALUES ($1, $2) ON CONFLICT DO NOTHING
        """, user["id"], profile_id)
    return {"is_following": True}


@router.delete("/users/{profile_id}")
async def unfollow(profile_id: int, user: CurrentUser):
    require_test_access(user)
    async with get_connection() as db:
        await db.execute("DELETE FROM user_follows WHERE follower_id=$1 AND following_id=$2", user["id"], profile_id)
    return {"is_following": False}
