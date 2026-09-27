import asyncio
import html
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError

from backend.database.database import get_connection
from backend.i18n.notifications import habit_reminder_text, normalize_language

logger = logging.getLogger("uvicorn.error")

CHECK_INTERVAL_SECONDS = 60
DEFAULT_TIMEZONE = "Europe/Kyiv"


def get_safe_timezone(timezone_name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(timezone_name or DEFAULT_TIMEZONE)
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_TIMEZONE)


async def get_habit_reminder_candidates():
    async with get_connection() as connection:
        return await connection.fetch(
            """
            SELECT
                h.id AS habit_id,
                h.title,
                h.emoji,
                h.repeat_type,
                h.repeat_days,
                h.weekly_target,
                h.challenge_target,
                h.repeat_started_on,
                h.habit_reminder,
                h.habit_reminder_last_sent_date,
                u.telegram_id,
                us.timezone,
                us.language
            FROM habits AS h
            INNER JOIN users AS u ON u.id = h.user_id
            LEFT JOIN user_settings AS us ON us.user_id = h.user_id
            WHERE h.is_archived = FALSE
              AND h.habit_reminder IS NOT NULL
              AND u.telegram_id IS NOT NULL
            """
        )


async def get_completion_state(habit_id: int, local_date, week_start, week_end):
    async with get_connection() as connection:
        today_done = await connection.fetchval(
            """
            SELECT EXISTS (
                SELECT 1
                FROM habit_confirmations
                WHERE habit_id = $1
                  AND confirmation_date = $2
                  AND is_confirmed = TRUE
            )
            """,
            habit_id,
            local_date,
        )

        week_count = await connection.fetchval(
            """
            SELECT COUNT(*)
            FROM habit_confirmations
            WHERE habit_id = $1
              AND confirmation_date BETWEEN $2 AND $3
              AND is_confirmed = TRUE
            """,
            habit_id,
            week_start,
            week_end,
        )

    return bool(today_done), int(week_count or 0)


def should_remind_today(row, local_date, today_done: bool, week_count: int) -> bool:
    if today_done:
        return False

    started_on = row["repeat_started_on"]
    if started_on and local_date < started_on:
        return False

    repeat_type = row["repeat_type"]

    if repeat_type == "days":
        return local_date.isoweekday() in set(row["repeat_days"] or [])

    if repeat_type == "weekly":
        return week_count < int(row["weekly_target"] or 1)

    if repeat_type == "challenge":
        # Челлендж — N дней подряд, поэтому он остаётся активным
        # ежедневно, пока пользователь продолжает его выполнять.
        return True

    return False


async def mark_habit_reminder_sent(habit_id: int, local_date) -> None:
    async with get_connection() as connection:
        await connection.execute(
            """
            UPDATE habits
            SET habit_reminder_last_sent_date = $2
            WHERE id = $1
            """,
            habit_id,
            local_date,
        )


async def process_habit_reminder(bot, row) -> None:
    timezone = get_safe_timezone(row["timezone"])
    local_now = datetime.now(timezone)
    local_date = local_now.date()
    reminder_time = row["habit_reminder"]

    if reminder_time is None:
        return

    if (local_now.hour, local_now.minute) != (reminder_time.hour, reminder_time.minute):
        return

    if row["habit_reminder_last_sent_date"] == local_date:
        return

    week_start = local_date - timedelta(days=local_date.weekday())
    week_end = week_start + timedelta(days=6)
    today_done, week_count = await get_completion_state(
        int(row["habit_id"]), local_date, week_start, week_end
    )

    if not should_remind_today(row, local_date, today_done, week_count):
        return

    text = habit_reminder_text(
        title=html.escape(str(row["title"] or "")),
        emoji=html.escape(str(row["emoji"] or "✱")),
        language=normalize_language(row["language"]),
    )

    try:
        await bot.send_message(
            chat_id=int(row["telegram_id"]),
            text=text,
            parse_mode="HTML",
        )
    except (TelegramForbiddenError, TelegramBadRequest):
        logger.warning("Habit reminder not delivered: habit_id=%s", row["habit_id"])
        return
    except Exception:
        logger.exception("Habit reminder send failed: habit_id=%s", row["habit_id"])
        return

    await mark_habit_reminder_sent(int(row["habit_id"]), local_date)


async def check_habit_reminders(bot) -> None:
    rows = await get_habit_reminder_candidates()
    for row in rows:
        try:
            await process_habit_reminder(bot, row)
        except Exception:
            logger.exception("Habit reminder processing failed: habit_id=%s", row["habit_id"])


async def run_habit_reminder_loop(bot) -> None:
    logger.info("Habit Reminder Service запущен")
    while True:
        try:
            await check_habit_reminders(bot)
        except asyncio.CancelledError:
            logger.info("Habit Reminder Service остановлен")
            raise
        except Exception:
            logger.exception("Habit Reminder Service: ошибка цикла проверки")

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
