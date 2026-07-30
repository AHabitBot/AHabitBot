import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Переменная DATABASE_URL не найдена в .env")

_pool: asyncpg.Pool | None = None


async def connect_db() -> asyncpg.Pool:
    """Создаёт пул подключений к PostgreSQL."""
    global _pool

    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=60,
        )

    return _pool


async def close_db() -> None:
    """Закрывает пул подключений."""
    global _pool

    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """Возвращает уже созданный пул."""
    if _pool is None:
        raise RuntimeError(
            "База данных ещё не подключена. Сначала вызови await connect_db()."
        )

    return _pool


@asynccontextmanager
async def get_connection() -> AsyncIterator[asyncpg.Connection]:
    """Выдаёт подключение из пула."""
    pool = get_pool()

    async with pool.acquire() as connection:
        yield connection


@asynccontextmanager
async def transaction() -> AsyncIterator[asyncpg.Connection]:
    """Выдаёт подключение и открывает транзакцию."""
    pool = get_pool()

    async with pool.acquire() as connection:
        async with connection.transaction():
            yield connection