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
# BROADCAST — SETTINGS RELEASE
# =========================================================


SUPPORTED_LANGUAGES = {
    "ru",
    "uk",
    "en",
}

DEFAULT_LANGUAGE = "ru"


MESSAGES = {
    "ru": (
        "⚙️ <b>Раздел «Настройки» уже доступен!</b>\n"
        "\n"
        "Теперь ты можешь настроить AHabit под себя:\n"
        "\n"
        "🔔 <b>Напоминания</b> — включай или отключай уведомления от бота.\n"
        "🌐 <b>Язык</b> — Русский, Українська или English.\n"
        "🕒 <b>Часовой пояс</b> — для правильного расчёта дня и напоминаний.\n"
        "🌓 <b>Тема</b> — светлое или тёмное оформление приложения.\n"
        "\n"
        "📍 <b>Где найти:</b>\n"
        "Профиль → Данные и настройки\n"
        "\n"
        "Настрой приложение так, как удобно именно тебе 💪"
    ),

    "uk": (
        "⚙️ <b>Розділ «Дані та налаштування» вже доступний!</b>\n"
        "\n"
        "Тепер ти можеш налаштувати AHabit під себе:\n"
        "\n"
        "🔔 <b>Нагадування</b> — вмикай або вимикай сповіщення від бота.\n"
        "🌐 <b>Мова</b> — Русский, Українська або English.\n"
        "🕒 <b>Часовий пояс</b> — для правильного розрахунку дня та нагадувань.\n"
        "🌓 <b>Тема</b> — світле або темне оформлення застосунку.\n"
        "\n"
        "📍 <b>Де знайти:</b>\n"
        "Профіль → Дані та налаштування\n"
        "\n"
        "Налаштуй застосунок так, як зручно саме тобі 💪"
    ),

    "en": (
        "⚙️ <b>Data & Settings is now available!</b>\n"
        "\n"
        "You can now customize AHabit to fit you:\n"
        "\n"
        "🔔 <b>Reminders</b> — turn bot notifications on or off.\n"
        "🌐 <b>Language</b> — Русский, Українська, or English.\n"
        "🕒 <b>Time zone</b> — used for accurate day tracking and reminders.\n"
        "🌓 <b>Theme</b> — choose light or dark mode.\n"
        "\n"
        "📍 <b>Where to find it:</b>\n"
        "Profile → Data & Settings\n"
        "\n"
        "Set up the app the way that works best for you 💪"
    ),
}


# =========================================================
# НОРМАЛИЗОВАТЬ ЯЗЫК
# =========================================================

def normalize_language(
    language: str | None,
) -> str:
    value = (
        str(
            language
            or DEFAULT_LANGUAGE
        )
        .strip()
        .lower()
    )

    if value in SUPPORTED_LANGUAGES:
        return value

    return DEFAULT_LANGUAGE


# =========================================================
# ПОЛУЧИТЬ ТЕКСТ СООБЩЕНИЯ
# =========================================================

def get_message_text(
    language: str | None,
) -> str:
    safe_language = normalize_language(
        language
    )

    return MESSAGES[
        safe_language
    ]


# =========================================================
# ПОЛУЧИТЬ ПОЛЬЗОВАТЕЛЕЙ
# =========================================================

async def get_all_users() -> list[dict]:
    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                u.telegram_id,
                COALESCE(
                    us.language,
                    'ru'
                ) AS language

            FROM users AS u

            LEFT JOIN user_settings AS us
                ON us.user_id = u.id

            WHERE u.telegram_id IS NOT NULL

            ORDER BY u.id ASC
            """
        )

    return [
        {
            "telegram_id": int(
                row["telegram_id"]
            ),

            "language": normalize_language(
                row["language"]
            ),
        }
        for row in rows
    ]


# =========================================================
# ОТПРАВИТЬ ОДНОМУ ПОЛЬЗОВАТЕЛЮ
# =========================================================

async def send_message_to_user(
    bot: Bot,
    telegram_id: int,
    language: str,
) -> str:
    """
    Возвращает:
        sent
        blocked
        failed
    """

    message_text = get_message_text(
        language
    )

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=message_text,
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
                text=message_text,
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

async def broadcast_settings_release() -> None:
    bot = Bot(
        token=BOT_TOKEN
    )

    sent = 0
    blocked = 0
    failed = 0

    sent_by_language = {
        "ru": 0,
        "uk": 0,
        "en": 0,
    }

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

        users = (
            await get_all_users()
        )

        total = len(
            users
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

        for index, user in enumerate(
            users,
            start=1,
        ):
            telegram_id = int(
                user["telegram_id"]
            )

            language = normalize_language(
                user["language"]
            )

            result = (
                await send_message_to_user(
                    bot=bot,
                    telegram_id=telegram_id,
                    language=language,
                )
            )

            if result == "sent":
                sent += 1

                sent_by_language[
                    language
                ] += 1

                print(
                    f"✅ [{index}/{total}] "
                    f"Отправлено: "
                    f"{telegram_id} "
                    f"[{language}]"
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
            f"👥 Всего:          {total}"
        )
        print(
            f"✅ Отправлено:     {sent}"
        )
        print(
            f"   🇷🇺 RU:          {sent_by_language['ru']}"
        )
        print(
            f"   🇺🇦 UK:          {sent_by_language['uk']}"
        )
        print(
            f"   🇬🇧 EN:          {sent_by_language['en']}"
        )
        print(
            f"🚫 Заблокировали:  {blocked}"
        )
        print(
            f"❌ Ошибок:         {failed}"
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
        broadcast_settings_release()
    )