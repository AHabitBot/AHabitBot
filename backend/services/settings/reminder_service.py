import asyncio
import logging
from datetime import datetime
from zoneinfo import (
    ZoneInfo,
    ZoneInfoNotFoundError,
)

from backend.database.database import (
    get_connection,
)
from backend.i18n.notifications import reminder_text, normalize_language


logger = logging.getLogger(
    "uvicorn.error"
)


# =========================================================
# НАСТРОЙКИ НАПОМИНАНИЙ
# =========================================================

REMINDER_HOUR = 20
REMINDER_MINUTE = 00
CHECK_INTERVAL_SECONDS = 60

DEFAULT_TIMEZONE = "Europe/Kyiv"


# =========================================================
# БЕЗОПАСНО ПОЛУЧИТЬ TIMEZONE
# =========================================================

def get_safe_timezone(
    timezone_name: str | None,
) -> ZoneInfo:
    safe_name = (
        timezone_name
        or DEFAULT_TIMEZONE
    )

    try:
        return ZoneInfo(
            safe_name
        )

    except ZoneInfoNotFoundError:
        return ZoneInfo(
            DEFAULT_TIMEZONE
        )


# =========================================================
# ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЕЙ С НАПОМИНАНИЯМИ
# =========================================================

async def get_reminder_users():
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                u.id AS user_id,
                u.telegram_id,
                us.timezone,
                us.language,
                us.last_reminder_date

            FROM user_settings AS us

            INNER JOIN users AS u
                ON u.id = us.user_id

            WHERE us.reminders_enabled = TRUE
            """
        )

    return rows


# =========================================================
# ОТМЕТИТЬ НАПОМИНАНИЕ КАК ОТПРАВЛЕННОЕ
# =========================================================

async def mark_reminder_sent(
    user_id: int,
    reminder_date,
):
    async with get_connection() as connection:
        await connection.execute(
            """
            UPDATE user_settings
            SET
                last_reminder_date = $2,
                updated_at = NOW()

            WHERE user_id = $1
            """,
            user_id,
            reminder_date,
        )


# =========================================================
# ПРОВЕРИТЬ ОДНОГО ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def process_reminder_user(
    bot,
    row,
):
    user_id = int(
        row["user_id"]
    )

    telegram_id = int(
        row["telegram_id"]
    )

    timezone = get_safe_timezone(
        row["timezone"]
    )

    local_now = datetime.now(
        timezone
    )

    local_date = local_now.date()


    # -----------------------------------------------------
    # Ещё не 20:00 пользователя
    # -----------------------------------------------------

    if (
        local_now.hour
        != REMINDER_HOUR
    ):
        return


    if (
        local_now.minute
        != REMINDER_MINUTE
    ):
        return


    # -----------------------------------------------------
    # Сегодня уже отправляли
    # -----------------------------------------------------

    if (
        row["last_reminder_date"]
        == local_date
    ):
        return


    # -----------------------------------------------------
    # Отправляем сообщение
    # -----------------------------------------------------

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=reminder_text(normalize_language(row["language"])),
            parse_mode="HTML",
        )

    except Exception:
        logger.exception(
            "\n"
            "==================================================\n"
            "Ошибка отправки напоминания\n\n"
            "Пользователь : %s\n"
            "Telegram ID  : %s\n"
            "Timezone     : %s\n"
            "==================================================",
            user_id,
            telegram_id,
            row["timezone"],
        )

        return


    # -----------------------------------------------------
    # Только ПОСЛЕ успешной отправки
    # записываем дату
    # -----------------------------------------------------

    await mark_reminder_sent(
        user_id=user_id,
        reminder_date=local_date,
    )


    logger.info(
        "\n"
        "==================================================\n"
        "Отправлено ежедневное напоминание\n\n"
        "Пользователь : %s\n"
        "Telegram ID  : %s\n"
        "Локальная дата: %s\n"
        "Timezone     : %s\n"
        "==================================================",
        user_id,
        telegram_id,
        local_date,
        row["timezone"],
    )


# =========================================================
# ОДНА ПРОВЕРКА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
# =========================================================

async def check_daily_reminders(
    bot,
):
    users = await get_reminder_users()

    for row in users:
        try:
            await process_reminder_user(
                bot,
                row,
            )

        except Exception:
            logger.exception(
                "Reminder Service: "
                "ошибка обработки пользователя %s",
                row["user_id"],
            )


# =========================================================
# ПОСТОЯННЫЙ ФОНОВЫЙ ЦИКЛ
# =========================================================

async def run_reminder_loop(
    bot,
):
    logger.info(
        "Reminder Service запущен"
    )

    while True:
        try:
            await check_daily_reminders(
                bot
            )

        except asyncio.CancelledError:
            logger.info(
                "Reminder Service остановлен"
            )

            raise

        except Exception:
            logger.exception(
                "Reminder Service: "
                "ошибка цикла проверки"
            )


        await asyncio.sleep(
            CHECK_INTERVAL_SECONDS
        )