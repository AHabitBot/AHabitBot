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
# BROADCAST — SMALL CARDS / GAME STATS / WEEKLY COMPETITIONS
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
        'Продолжаем совершенствовать приложение, чтобы развивать привычки было ещё удобнее и интереснее.\n'
        '\n'
        '🟦 <b>Маленькие карточки привычек</b>\n'
        'Теперь доступны два размера карточек — большой и маленький. Две маленькие карточки занимают место одной большой. Настраивай главный экран под себя!\n'
        '\n'
        '📊 <b>Обновлённые игровые показатели</b>\n'
        'Личный и дружеский стрики теперь находятся в разделе игровых показателей. Вся важная статистика собрана в одном месте — следи за своим прогрессом и достижениями друзей!\n'
        '\n'
        '🏆 <b>Недельные состязания</b>\n'
        'Мы убрали сезоны и перевели систему лиг на формат еженедельных соревнований. Теперь развитие рейтинга будет строиться вокруг недельного прогресса.'
    )


# =========================================================
# MESSAGE — UK
# =========================================================

def build_message_uk() -> str:
    return (
        '🚀 <b>AHabit — нове оновлення!</b>\n'
        '\n'
        'Продовжуємо вдосконалювати застосунок, щоб розвивати звички було ще зручніше та цікавіше.\n'
        '\n'
        '🟦 <b>Маленькі картки звичок</b>\n'
        'Тепер доступні два розміри карток — великий і маленький. Дві маленькі картки займають місце однієї великої. Налаштовуй головний екран під себе!\n'
        '\n'
        '📊 <b>Оновлені ігрові показники</b>\n'
        'Особистий і дружній стріки тепер знаходяться в розділі ігрових показників. Уся важлива статистика зібрана в одному місці — стеж за своїм прогресом і досягненнями друзів!\n'
        '\n'
        '🏆 <b>Тижневі змагання</b>\n'
        'Ми прибрали сезони й перевели систему ліг на формат щотижневих змагань. Тепер розвиток рейтингу будуватиметься навколо тижневого прогресу.'
    )


# =========================================================
# MESSAGE — EN
# =========================================================

def build_message_en() -> str:
    return (
        '🚀 <b>AHabit — New Update!</b>\n'
        '\n'
        "We're continuing to improve the app to make building habits easier and more engaging.\n"
        '\n'
        '🟦 <b>Small Habit Cards</b>\n'
        'Habit cards now come in two sizes: large and small. Two small cards take up the space of one large card. Customize your home screen your way!\n'
        '\n'
        '📊 <b>Updated Game Stats</b>\n'
        'Personal and friends streaks are now in Game Stats. All your key stats are in one place — track your progress and see how your friends are doing!\n'
        '\n'
        '🏆 <b>Weekly Competitions</b>\n'
        "We've removed seasons and shifted the league system to a weekly competition format. Rankings will now focus on weekly progress."
    )


def build_message_de() -> str:
    return (
        '🚀 <b>AHabit — Neues Update!</b>\n'
        '\n'
        'Wir verbessern die App weiter, damit es noch einfacher und motivierender wird, Gewohnheiten aufzubauen.\n'
        '\n'
        '🟦 <b>Kleine Gewohnheitskarten</b>\n'
        'Jetzt gibt es zwei Kartengrößen: groß und klein. Zwei kleine Karten benötigen so viel Platz wie eine große. Gestalte deinen Startbildschirm nach deinen Wünschen!\n'
        '\n'
        '📊 <b>Aktualisierte Spielstatistiken</b>\n'
        'Deine persönliche Serie und die Freundeserie findest du jetzt in den Spielstatistiken. Alle wichtigen Werte sind an einem Ort — verfolge deine Fortschritte und die deiner Freunde!\n'
        '\n'
        '🏆 <b>Wöchentliche Wettbewerbe</b>\n'
        'Wir haben die Saisons entfernt und das Ligasystem auf wöchentliche Wettbewerbe umgestellt. Künftig steht der Fortschritt innerhalb einer Woche im Mittelpunkt der Rangliste.'
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
