"""Isolated AHabit administration. No changes to habit/league services."""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from backend.database.database import get_pool

router = APIRouter(prefix="/admin", tags=["admin"], include_in_schema=False)
COOKIE = "ahabit_admin_session"
SESSION_HOURS = 12

class Credentials(BaseModel):
    login: str
    password: str

def password_hash(password: str, salt: bytes = None) -> str:
    salt = salt or secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$" + salt.hex() + "$" + derived.hex()

def verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt, expected = stored.split("$")
        return algo == "scrypt" and hmac.compare_digest(password_hash(password, bytes.fromhex(salt)), stored)
    except (ValueError, TypeError):
        return False

async def admin_auth(request: Request):
    token = request.cookies.get(COOKIE, "")
    if not token:
        raise HTTPException(401, "Требуется вход")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    row = await get_pool().fetchrow("SELECT id FROM admin_sessions WHERE token_hash=$1 AND expires_at>NOW()", token_hash)
    if not row:
        raise HTTPException(401, "Сессия истекла")
    return row["id"]

@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
async def admin_page():
    return HTMLResponse((Path(__file__).parent / "index.html").read_text(encoding="utf-8"), headers={"Cache-Control":"no-store"})

@router.post("/api/login")
async def login(payload: Credentials, request: Request, response: Response):
    configured_login = os.getenv("AHABIT_ADMIN_LOGIN", "")
    configured_hash = os.getenv("AHABIT_ADMIN_PASSWORD_HASH", "")
    if not configured_login or not configured_hash:
        raise HTTPException(503, "Администратор не настроен")
    ip = request.client.host if request.client else "unknown"
    # Database-backed rate limit, persists across workers/restarts.
    async with get_pool().acquire() as conn:
        async with conn.transaction():
            attempts = await conn.fetchval("SELECT COUNT(*) FROM admin_login_attempts WHERE ip=$1 AND created_at>NOW()-INTERVAL '15 minutes'", ip)
            if attempts >= 5:
                raise HTTPException(429, "Слишком много попыток. Попробуйте позже")
            good = hmac.compare_digest(payload.login, configured_login) and verify_password(payload.password, configured_hash)
            if not good:
                await conn.execute("INSERT INTO admin_login_attempts(ip) VALUES($1)", ip)
                # Avoid raising inside transaction: that would roll back attempt log.
            else:
                await conn.execute("DELETE FROM admin_login_attempts WHERE ip=$1", ip)
    if not good:
        raise HTTPException(401, "Неверный логин или пароль")
    token = secrets.token_urlsafe(48)
    await get_pool().execute("INSERT INTO admin_sessions(token_hash,expires_at) VALUES($1,$2)", hashlib.sha256(token.encode()).hexdigest(), datetime.now(timezone.utc)+timedelta(hours=SESSION_HOURS))
    response.set_cookie(COOKIE, token, httponly=True, secure=True, samesite="strict", max_age=SESSION_HOURS*3600, path="/admin")
    return {"ok": True}

@router.post("/api/logout")
async def logout(request: Request, response: Response, _: int = Depends(admin_auth)):
    token = request.cookies.get(COOKIE, "")
    await get_pool().execute("DELETE FROM admin_sessions WHERE token_hash=$1", hashlib.sha256(token.encode()).hexdigest())
    response.delete_cookie(COOKIE, path="/admin", secure=True, httponly=True, samesite="strict")
    return {"ok": True}

@router.get("/api/overview")
async def overview(_: int = Depends(admin_auth)):
    async with get_pool().acquire() as conn:
        users = await conn.fetchval("SELECT COUNT(*) FROM users")
        new7 = await conn.fetchval("SELECT COUNT(*) FROM users WHERE created_at >= NOW()-INTERVAL '7 days'")
        habits = await conn.fetchval("SELECT COUNT(*) FROM habits WHERE NOT is_archived")
        archived = await conn.fetchval("SELECT COUNT(*) FROM habits WHERE is_archived")
        confirmed = await conn.fetchval("SELECT COUNT(*) FROM habit_confirmations WHERE is_confirmed")
        referrals = await conn.fetchval("SELECT COUNT(*) FROM referrals")
        registrations = await conn.fetch("SELECT (created_at AT TIME ZONE 'Europe/Kyiv')::date AS day, COUNT(*) AS count FROM users WHERE created_at >= NOW()-INTERVAL '30 days' GROUP BY 1 ORDER BY 1")
    return {"users":users,"new_users_7d":new7,"active_habits":habits,"archived_habits":archived,"confirmed_days":confirmed,"referrals":referrals,"registrations":[{"date":str(r['day']),"count":r['count']} for r in registrations],"note":"DAU/WAU/MAU по открытиям появятся после подключения событий посещений."}

@router.get("/api/users")
async def users(page: int = 1, _: int = Depends(admin_auth)):
    if page < 1 or page > 100000:
        raise HTTPException(400, "Неверная страница")
    rows = await get_pool().fetch("""SELECT u.id, u.nickname, u.username, u.created_at, u.league_level, COALESCE(s.total_xp,0) AS total_xp, (SELECT COUNT(*) FROM habits h WHERE h.user_id=u.id AND NOT h.is_archived) AS habits FROM users u LEFT JOIN user_stats s ON s.user_id=u.id ORDER BY u.created_at DESC LIMIT 50 OFFSET $1""", (page-1)*50)
    return {"page":page,"items":[{"id":r['id'],"nickname":r['nickname'],"username":r['username'],"registered":r['created_at'].isoformat(),"league":r['league_level'],"xp":r['total_xp'],"habits":r['habits']} for r in rows]}
