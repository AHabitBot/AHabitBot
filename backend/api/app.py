from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)

from backend.api.habits import (
    router as habits_router,
)

from backend.database.database import (
    close_db,
    connect_db,
)

from backend.api.leaderboard import (
    router as leaderboard_router,
)

from backend.api.profile import (
    router as profile_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()

    try:
        yield
    finally:
        await close_db()


app = FastAPI(
    title="AHabit API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ahabit.org",
        "https://www.ahabit.org",
        "https://ahabitbot.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    habits_router
)

app.include_router(
    leaderboard_router
)

app.include_router(
    profile_router
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
    }