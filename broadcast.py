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
# BROADCAST — FRIENDS AND FOLLOWING UPDATE
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
        '🚀 <b>AHabit — новое обновление!</b>\n'
        '\n'
        'Развивать привычки вместе интереснее, но раньше найти друзей в AHabit было непросто.\n'
        '\n'
        '👥 <b>Теперь всё изменилось!</b>\n'
        '\n'
        '🔍 Находи друзей по никнейму или Telegram ID.\n'
        '\n'
        '🤝 Получай рекомендации людей, с которыми у тебя есть общие друзья.\n'
        '\n'
        '👤 Подписывайся на пользователей и следи за своими подписками и подписчиками.\n'
        '\n'
        '<b>Теперь AHabit — это не только развитие привычек, но и возможность окружить себя людьми, которые тоже стремятся стать лучше.</b> 🐜'
    )


def build_message_uk() -> str:
    return (
        '🚀 <b>AHabit — нове оновлення!</b>\n'
        '\n'
        'Розвивати звички разом цікавіше, але раніше знайти друзів в AHabit було непросто.\n'
        '\n'
        '👥 <b>Тепер усе змінилося!</b>\n'
        '\n'
        '🔍 Знаходь друзів за нікнеймом або Telegram ID.\n'
        '\n'
        '🤝 Отримуй рекомендації людей, з якими у тебе є спільні друзі.\n'
        '\n'
        '👤 Підписуйся на користувачів і стеж за своїми підписками та підписниками.\n'
        '\n'
        '<b>Тепер AHabit — це не лише розвиток звичок, а й можливість оточити себе людьми, які теж прагнуть стати кращими.</b> 🐜'
    )


def build_message_en() -> str:
    return (
        '🚀 <b>AHabit — new update!</b>\n'
        '\n'
        'Building habits together is more fun, but finding friends in AHabit used to be difficult.\n'
        '\n'
        '👥 <b>That has changed!</b>\n'
        '\n'
        '🔍 Find friends by nickname or Telegram ID.\n'
        '\n'
        '🤝 Get recommendations for people you have mutual friends with.\n'
        '\n'
        '👤 Follow other users and keep track of your following and followers.\n'
        '\n'
        '<b>AHabit is now more than building habits — it’s a way to surround yourself with people who also want to become better.</b> 🐜'
    )


def build_message_de() -> str:
    return (
        '🚀 <b>AHabit — neues Update!</b>\n'
        '\n'
        'Gemeinsam Gewohnheiten aufzubauen macht mehr Spaß, aber bisher war es nicht leicht, Freunde in AHabit zu finden.\n'
        '\n'
        '👥 <b>Das hat sich jetzt geändert!</b>\n'
        '\n'
        '🔍 Finde Freunde über ihren Nickname oder ihre Telegram-ID.\n'
        '\n'
        '🤝 Entdecke Personen, mit denen du gemeinsame Freunde hast.\n'
        '\n'
        '👤 Folge anderen Nutzern und behalte deine Abos und Follower im Blick.\n'
        '\n'
        '<b>AHabit hilft dir jetzt nicht nur dabei, Gewohnheiten zu entwickeln, sondern auch, dich mit Menschen zu umgeben, die sich ebenfalls verbessern wollen.</b> 🐜'
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

    if safe_language == "de":
        return build_message_de()

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
        "de": 0,
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
            f"   🇩🇪 DE:          "
            f"{sent_by_language['de']}"
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
