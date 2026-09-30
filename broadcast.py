import asyncio
from typing import Any

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

from backend.i18n.notifications import normalize_language


# =========================================================
# BROADCAST — FRIENDS / STREAKS / PUBLIC PROFILES UPDATE
# =========================================================


# =========================================================
# DRY RUN
# =========================================================

# True:
# сообщения НЕ отправляются,
# а только выводятся в консоль.
#
# После проверки поменяй на False.

DRY_RUN = False


# =========================================================
# GET USERS
# =========================================================

async def get_all_users() -> list[dict[str, Any]]:
    """
    Возвращает всех пользователей
    с Telegram ID и языком.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                u.id AS user_id,
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
            "user_id":
                int(
                    row["user_id"]
                ),

            "telegram_id":
                int(
                    row["telegram_id"]
                ),

            "language":
                normalize_language(
                    row["language"]
                ),
        }
        for row in rows
    ]


# =========================================================
# MESSAGE — RU
# =========================================================

def build_message_ru() -> str:
    return (
        "🚀 <b>Обновление AHabit</b>\n"
        "\n"

        "👥 <b>Привычки вместе с друзьями</b>\n"
        "Теперь привычки можно выполнять вместе. "
        "На карточке видно участников и кто уже выполнил привычку сегодня. "
        "Совместный день засчитывается, когда подтвердили все участники. "
        "О действиях друзей приходят уведомления.\n"
        "\n"

        "🔥 <b>Обновили работу серий привычек</b>\n"
        "Первый пропуск больше не обнуляет серию — "
        "она замораживается 🧊. "
        "Выполни привычку на следующий день, и серия восстановится 🔥. "
        "Два пропуска подряд обнуляют серию.\n"
        "\n"

        "🔥 <b>Личный и дружеский стрик</b>\n"
        "Теперь отдельно отображается личный стрик "
        "и стрик совместных привычек с друзьями.\n"
        "\n"

        "👤 <b>Публичные игровые профили</b>\n"
        "Нажми на аватар пользователя в рейтинге, "
        "чтобы открыть его профиль и посмотреть игровые показатели."
    )


# =========================================================
# MESSAGE — UK
# =========================================================

def build_message_uk() -> str:
    return (
        "🚀 <b>Оновлення AHabit</b>\n"
        "\n"

        "👥 <b>Звички разом із друзями</b>\n"
        "Тепер звички можна виконувати разом. "
        "На картці видно учасників і хто вже виконав звичку сьогодні. "
        "Спільний день зараховується, коли підтвердили всі учасники. "
        "Про дії друзів надходять сповіщення.\n"
        "\n"

        "🔥 <b>Оновили роботу серій звичок</b>\n"
        "Перший пропуск більше не обнуляє серію — "
        "вона заморожується 🧊. "
        "Виконай звичку наступного дня, і серія відновиться 🔥. "
        "Два пропуски поспіль обнуляють серію.\n"
        "\n"

        "🔥 <b>Особистий і дружній стрік</b>\n"
        "Тепер окремо відображається особистий стрік "
        "і стрік спільних звичок із друзями.\n"
        "\n"

        "👤 <b>Публічні ігрові профілі</b>\n"
        "Натисни на аватар користувача в рейтингу, "
        "щоб відкрити його профіль і переглянути ігрові показники."
    )


# =========================================================
# MESSAGE — EN
# =========================================================

def build_message_en() -> str:
    return (
        "🚀 <b>AHabit Update</b>\n"
        "\n"

        "👥 <b>Habits with friends</b>\n"
        "You can now complete habits together. "
        "The habit card shows the participants and who has completed it today. "
        "A shared day counts when every participant confirms the habit. "
        "You'll also receive notifications about your friends' activity.\n"
        "\n"

        "🔥 <b>Updated habit streaks</b>\n"
        "The first missed day no longer resets your streak — "
        "it freezes 🧊. "
        "Complete the habit the next day and the streak is restored 🔥. "
        "Two missed days in a row reset the streak.\n"
        "\n"

        "🔥 <b>Personal and friends streaks</b>\n"
        "Your personal streak and your shared-habit streak "
        "with friends are now shown separately.\n"
        "\n"

        "👤 <b>Public game profiles</b>\n"
        "Tap a user's avatar in the leaderboard "
        "to open their profile and view their game stats."
    )


# =========================================================
# GET MESSAGE
# =========================================================

def get_message_text(
    language: str | None,
) -> str:
    safe_language = (
        normalize_language(
            language
        )
    )

    if safe_language == "uk":
        return build_message_uk()

    if safe_language == "en":
        return build_message_en()

    return build_message_ru()


# =========================================================
# SEND TO USER
# =========================================================

async def send_message_to_user(
    bot: Bot,
    user: dict[str, Any],
) -> str:
    """
    Returns:
        sent
        blocked
        failed
    """

    telegram_id = int(
        user["telegram_id"]
    )

    language = (
        normalize_language(
            user["language"]
        )
    )

    message_text = (
        get_message_text(
            language=language,
        )
    )


    # =====================================================
    # DRY RUN
    # =====================================================

    if DRY_RUN:
        print()
        print(
            "========================================="
        )
        print(
            f"👤 user_id: "
            f"{user['user_id']}"
        )
        print(
            f"📨 telegram_id: "
            f"{telegram_id}"
        )
        print(
            f"🌐 language: "
            f"{language}"
        )
        print(
            "-----------------------------------------"
        )
        print(
            message_text
        )
        print(
            "========================================="
        )

        return "sent"


    # =====================================================
    # SEND
    # =====================================================

    try:
        await bot.send_message(
            chat_id=
                telegram_id,

            text=
                message_text,

            parse_mode=
                "HTML",
        )

        return "sent"


    # =====================================================
    # BLOCKED
    # =====================================================

    except TelegramForbiddenError:
        print(
            f"🚫 Пользователь "
            f"{telegram_id} "
            f"заблокировал бота"
        )

        return "blocked"


    # =====================================================
    # FLOOD CONTROL
    # =====================================================

    except TelegramRetryAfter as error:
        retry_after = int(
            error.retry_after
        )

        print(
            f"⏳ Telegram попросил "
            f"подождать "
            f"{retry_after} сек. "
            f"Пользователь: "
            f"{telegram_id}"
        )

        await asyncio.sleep(
            retry_after + 1
        )

        try:
            await bot.send_message(
                chat_id=
                    telegram_id,

                text=
                    message_text,

                parse_mode=
                    "HTML",
            )

            return "sent"

        except Exception as retry_error:
            print(
                f"❌ Повторная отправка "
                f"не удалась "
                f"{telegram_id}: "
                f"{retry_error}"
            )

            return "failed"


    # =====================================================
    # BAD REQUEST
    # =====================================================

    except TelegramBadRequest as error:
        print(
            f"⚠️ TelegramBadRequest "
            f"{telegram_id}: "
            f"{error}"
        )

        return "failed"


    # =====================================================
    # OTHER ERROR
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

async def broadcast_update() -> None:
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


        if DRY_RUN:
            print(
                "🧪 DRY RUN включён. "
                "Сообщения НЕ отправляются."
            )

        else:
            print(
                "📨 Начинаем реальную рассылку..."
            )


        # =================================================
        # SEND
        # =================================================

        for index, user in enumerate(
            users,
            start=1,
        ):
            language = (
                normalize_language(
                    user["language"]
                )
            )

            result = (
                await send_message_to_user(
                    bot=bot,
                    user=user,
                )
            )


            if result == "sent":
                sent += 1

                if language not in sent_by_language:
                    language = "ru"

                sent_by_language[
                    language
                ] += 1

                if not DRY_RUN:
                    print(
                        f"✅ [{index}/{total}] "
                        f"Отправлено: "
                        f"{user['telegram_id']} "
                        f"[{language}]"
                    )


            elif result == "blocked":
                blocked += 1


            else:
                failed += 1


            if not DRY_RUN:
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

        if DRY_RUN:
            print(
                "🧪 РЕЗУЛЬТАТ DRY RUN"
            )

        else:
            print(
                "📊 РЕЗУЛЬТАТ РАССЫЛКИ"
            )

        print(
            "========================================="
        )
        print(
            f"👥 Всего:          "
            f"{total}"
        )
        print(
            f"✅ Обработано:      "
            f"{sent}"
        )
        print(
            f"   🇷🇺 RU:          "
            f"{sent_by_language['ru']}"
        )
        print(
            f"   🇺🇦 UK:          "
            f"{sent_by_language['uk']}"
        )
        print(
            f"   🇬🇧 EN:          "
            f"{sent_by_language['en']}"
        )
        print(
            f"🚫 Заблокировали:  "
            f"{blocked}"
        )
        print(
            f"❌ Ошибок:         "
            f"{failed}"
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
        broadcast_update()
    )
