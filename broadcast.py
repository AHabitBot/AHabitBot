import asyncio

from aiogram import Bot
from aiogram.exceptions import (
    TelegramBadRequest,
    TelegramForbiddenError,
    TelegramRetryAfter,
)

from config import BOT_TOKEN

from backend.database.database import (
    close_db,
    connect_db,
    get_connection,
)


# =========================================================
# BROADCAST — STATS RELEASE
# =========================================================


MESSAGE_TEXT = (
    "📦 <b>Архив привычек уже доступен!</b>\n"
    "\n"
    "Теперь привычки, которые ты больше не хочешь отслеживать, "
    "можно отправить в архив. Вся история, подтверждения "
    "и серии привычки сохраняются.\n"
    "\n"
    "В любой момент привычку можно восстановить "
    "и продолжить отслеживать её снова.\n"
    "\n"
    "📍 <b>Где найти:</b>\n"
    "Профиль → Архив привычек\n"
    "\n"
    "Наводи порядок и оставляй в фокусе главное 💪"
)


# =========================================================
# ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЕЙ
# =========================================================

async def get_all_telegram_ids() -> list[int]:
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT telegram_id
            FROM users
            WHERE telegram_id IS NOT NULL
            ORDER BY id ASC
            """
        )

    return [
        int(row["telegram_id"])
        for row in rows
    ]


# =========================================================
# ОТПРАВИТЬ ОДНОМУ ПОЛЬЗОВАТЕЛЮ
# =========================================================

async def send_message_to_user(
    bot: Bot,
    telegram_id: int,
) -> str:
    """
    Возвращает:
        sent
        blocked
        failed
    """

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=MESSAGE_TEXT,
            parse_mode="HTML",
        )

        return "sent"

    # =====================================================
    # ПОЛЬЗОВАТЕЛЬ ЗАБЛОКИРОВАЛ БОТА
    # =====================================================

    except TelegramForbiddenError:
        print(
            f"🚫 Пользователь {telegram_id} "
            f"заблокировал бота"
        )

        return "blocked"

    # =====================================================
    # FLOOD CONTROL TELEGRAM
    # =====================================================

    except TelegramRetryAfter as error:
        retry_after = int(
            error.retry_after
        )

        print(
            f"⏳ Telegram попросил подождать "
            f"{retry_after} сек. "
            f"Пользователь: {telegram_id}"
        )

        await asyncio.sleep(
            retry_after + 1
        )

        try:
            await bot.send_message(
                chat_id=telegram_id,
                text=MESSAGE_TEXT,
                parse_mode="HTML",
            )

            return "sent"

        except Exception as retry_error:
            print(
                f"❌ Повторная отправка не удалась "
                f"{telegram_id}: "
                f"{retry_error}"
            )

            return "failed"

    # =====================================================
    # НЕКОРРЕКТНЫЙ CHAT / USER
    # =====================================================

    except TelegramBadRequest as error:
        print(
            f"⚠️ TelegramBadRequest "
            f"{telegram_id}: "
            f"{error}"
        )

        return "failed"

    # =====================================================
    # ПРОЧАЯ ОШИБКА
    # =====================================================

    except Exception as error:
        print(
            f"❌ Ошибка отправки "
            f"{telegram_id}: "
            f"{error}"
        )

        return "failed"


# =========================================================
# BROADCAST
# =========================================================

async def broadcast_stats_release() -> None:
    bot = Bot(
        token=BOT_TOKEN
    )

    sent = 0
    blocked = 0
    failed = 0

    try:
        # =================================================
        # DATABASE
        # =================================================

        await connect_db()

        print(
            "✅ База данных подключена"
        )

        # =================================================
        # USERS
        # =================================================

        telegram_ids = (
            await get_all_telegram_ids()
        )

        total = len(
            telegram_ids
        )

        print(
            f"👥 Пользователей для рассылки: "
            f"{total}"
        )

        if total == 0:
            print(
                "⚠️ Пользователи не найдены"
            )

            return

        print(
            "📨 Начинаем рассылку..."
        )

        # =================================================
        # SEND
        # =================================================

        for index, telegram_id in enumerate(
            telegram_ids,
            start=1,
        ):
            result = (
                await send_message_to_user(
                    bot=bot,
                    telegram_id=telegram_id,
                )
            )

            if result == "sent":
                sent += 1

                print(
                    f"✅ [{index}/{total}] "
                    f"Отправлено: "
                    f"{telegram_id}"
                )

            elif result == "blocked":
                blocked += 1

            else:
                failed += 1

            # Небольшая пауза,
            # чтобы не отправлять всё одним burst.
            await asyncio.sleep(
                0.05
            )

        # =================================================
        # RESULT
        # =================================================

        print()
        print(
            "========================================="
        )
        print(
            "📊 РЕЗУЛЬТАТ РАССЫЛКИ"
        )
        print(
            "========================================="
        )
        print(
            f"👥 Всего:       {total}"
        )
        print(
            f"✅ Отправлено:  {sent}"
        )
        print(
            f"🚫 Заблокировали: {blocked}"
        )
        print(
            f"❌ Ошибок:      {failed}"
        )
        print(
            "========================================="
        )

    finally:
        # =================================================
        # CLOSE
        # =================================================

        await close_db()

        await bot.session.close()

        print(
            "✅ Соединения закрыты"
        )


# =========================================================
# START
# =========================================================

if __name__ == "__main__":
    asyncio.run(
        broadcast_stats_release()
    )