"""Социальные подписки: закрытое тестирование для владельца AHabit."""
from fastapi import APIRouter, HTTPException, Query
from backend.api.dependencies import CurrentUser
from backend.database.database import get_connection

router = APIRouter(prefix="/api/follows", tags=["follows"])
TEST_TELEGRAM_ID = 900410719


def require_test_access(user):
    if int(user["telegram_id"]) != TEST_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Функция пока недоступна")


@router.get("/suggestions")
async def follow_suggestions(user: CurrentUser, limit: int = Query(3, ge=1, le=30), offset: int = Query(0, ge=0)):
    """Friends-of-following ranked by number of shared connections."""
    require_test_access(user)
    async with get_connection() as db:
        rows = await db.fetch("""
            SELECT u.id, u.nickname, u.avatar_key,
                   COALESCE(s.highest_level_reached, 1) AS level,
                   COUNT(DISTINCT mutual.id) AS mutual_count,
                   (ARRAY_AGG(mutual.nickname ORDER BY mutual.id))[1] AS mutual_name
            FROM user_follows mine
            JOIN users mutual ON mutual.id = mine.following_id
            JOIN user_follows second_degree ON second_degree.follower_id = mutual.id
            JOIN users u ON u.id = second_degree.following_id
            LEFT JOIN user_stats s ON s.user_id = u.id
            WHERE mine.follower_id = $1
              AND u.id <> $1
              AND NOT EXISTS (
                  SELECT 1 FROM user_follows existing
                  WHERE existing.follower_id = $1 AND existing.following_id = u.id
              )
              AND NOT EXISTS (
                  SELECT 1 FROM user_follow_suggestions_hidden hidden
                  WHERE hidden.user_id = $1 AND hidden.suggested_user_id = u.id
              )
            GROUP BY u.id, u.nickname, u.avatar_key, s.highest_level_reached
            ORDER BY mutual_count DESC, u.id ASC
            LIMIT $2 OFFSET $3
        """, int(user["id"]), limit + 1, offset)
    return {"items": [dict(r) for r in rows[:limit]], "has_more": len(rows) > limit}


@router.post("/suggestions/{profile_id}/hide")
async def hide_follow_suggestion(profile_id: int, user: CurrentUser):
    """Persistently dismiss a recommendation for the current viewer."""
    require_test_access(user)
    viewer_id = int(user["id"])
    if profile_id == viewer_id:
        raise HTTPException(status_code=400, detail="Нельзя скрыть свой профиль")
    async with get_connection() as db:
        if not await db.fetchval("SELECT 1 FROM users WHERE id=$1", profile_id):
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        await db.execute("""
            INSERT INTO user_follow_suggestions_hidden (user_id, suggested_user_id)
            VALUES ($1, $2) ON CONFLICT DO NOTHING
        """, viewer_id, profile_id)
    return {"hidden": True}


@router.get("/search")
async def search_users(
    user: CurrentUser,
    q: str = Query("", max_length=64),
    limit: int = Query(30, ge=1, le=30),
    offset: int = Query(0, ge=0),
):
    """Search public nicknames or exact Telegram ID; never expose Telegram IDs."""
    require_test_access(user)
    term = q.strip().lstrip("@")
    if not term:
        return {"items": [], "has_more": False}
    telegram_id = int(term) if term.isascii() and term.isdecimal() and len(term) <= 18 else None
    async with get_connection() as db:
        rows = await db.fetch("""
            SELECT u.id, u.nickname, u.avatar_key,
                   EXISTS (
                       SELECT 1 FROM user_follows f
                       WHERE f.follower_id = $1 AND f.following_id = u.id
                   ) AS is_following
            FROM users u
            WHERE u.id <> $1
              AND (
                  u.nickname ILIKE '%' || $2 || '%'
                  OR ($3::bigint IS NOT NULL AND u.telegram_id = $3)
              )
            ORDER BY
                CASE WHEN lower(u.nickname) = lower($2) THEN 0
                     WHEN lower(u.nickname) LIKE lower($2) || '%' THEN 1
                     WHEN u.telegram_id = $3 THEN 0
                     ELSE 2 END,
                lower(u.nickname) NULLS LAST, u.id
            LIMIT $4 OFFSET $5
        """, int(user["id"]), term, telegram_id, limit + 1, offset)
    return {"items": [dict(row) for row in rows[:limit]], "has_more": len(rows) > limit}


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


@router.get("/me/list")
async def my_social_list(user: CurrentUser, kind: str = Query("following", pattern="^(following|followers)$"), limit: int = Query(30, ge=1, le=100), offset: int = Query(0, ge=0)):
    """Списки текущего пользователя; единая реализация с публичным профилем."""
    return await social_list(int(user["id"]), user, kind, limit, offset)
