"""Проверка завершённых недель. Выключена до явной активации лиг в БД."""
import asyncio
import logging

from backend.database.database import get_pool
from backend.services.leaderboard.league_transition_service import process_due_weeks

logger = logging.getLogger(__name__)

async def run_league_week_loop():
    while True:
        try:
            await process_due_weeks(get_pool())
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Ошибка обработки недельных лиг; повтор через 60 секунд")
        await asyncio.sleep(60)
