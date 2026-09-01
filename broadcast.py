import asyncio
import html
from datetime import date
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

from backend.repositories.leaderboard.season_results_repository import (
    get_finished_season_payload,
)


# =========================================================
# BROADCAST — SEASON 1 RESULTS
# =========================================================


# =========================================================
# SEASON
# =========================================================

SEASON_NUMBER = 1

SEASON_ACTIVE_START = date(
    2026,
    6,
    1,
)

# Итоги рейтинга сезона были зафиксированы
# перед финальной неделей итогов.
SEASON_ACTIVE_END = date(
    2026,
    8,
    24,
)


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
# LANGUAGES
# =========================================================

SUPPORTED_LANGUAGES = {
    "ru",
    "uk",
    "en",
}

DEFAULT_LANGUAGE = "ru"


# =========================================================
# NORMALIZE LANGUAGE
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
# SAFE TEXT
# =========================================================

def safe_text(
    value: Any,
    fallback: str = "—",
) -> str:
    if value is None:
        return fallback

    text = str(
        value
    ).strip()

    if not text:
        return fallback

    return html.escape(
        text
    )


# =========================================================
# GET USERS
# =========================================================

async def get_all_users(
    season_number: int,
) -> list[dict[str, Any]]:
    """
    Возвращает всех пользователей
    с Telegram ID, языком и их
    финальным результатом сезона.
    """

    async with get_connection() as connection:
        rows = await connection.fetch(
            """
            SELECT
                u.id AS user_id,
                u.telegram_id,
                u.nickname,

                COALESCE(
                    us.language,
                    'ru'
                ) AS language,

                sr.final_rank,
                sr.final_xp

            FROM users AS u

            LEFT JOIN user_settings AS us
                ON us.user_id = u.id

            LEFT JOIN season_results AS sr
                ON sr.user_id = u.id
               AND sr.season_number = $1

            WHERE u.telegram_id IS NOT NULL

            ORDER BY u.id ASC
            """,
            season_number,
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

            "nickname":
                row["nickname"],

            "language":
                normalize_language(
                    row["language"]
                ),

            "final_rank": (
                int(
                    row["final_rank"]
                )
                if row["final_rank"]
                is not None
                else None
            ),

            "final_xp": (
                int(
                    row["final_xp"]
                )
                if row["final_xp"]
                is not None
                else 0
            ),
        }
        for row in rows
    ]


# =========================================================
# GET COMMON SEASON DATA
# =========================================================

async def get_season_summary() -> dict[str, Any]:
    """
    Получает общие итоги сезона:
    Top-3, лучший стрик,
    популярную привычку и владельцев.

    user_id=0 используется только потому,
    что current_user здесь не нужен.
    """

    return await get_finished_season_payload(
        season_number=
            SEASON_NUMBER,

        user_id=0,

        active_start=
            SEASON_ACTIVE_START,

        active_end=
            SEASON_ACTIVE_END,
    )


# =========================================================
# FORMAT TOP 3
# =========================================================

def build_top3_lines(
    top3: list[dict[str, Any]],
) -> str:
    medals = {
        1: "🥇",
        2: "🥈",
        3: "🥉",
    }

    rows: list[str] = []

    for item in top3:
        rank = int(
            item.get(
                "rank"
            )
            or 0
        )

        nickname = safe_text(
            item.get(
                "nickname"
            ),
            fallback="Player",
        )

        season_xp = int(
            item.get(
                "season_xp"
            )
            or 0
        )

        medal = medals.get(
            rank,
            "🏅",
        )

        rows.append(
            f"{medal} "
            f"<b>{nickname}</b> — "
            f"{season_xp} XP"
        )

    if not rows:
        return "—"

    return "\n".join(
        rows
    )


# =========================================================
# USER RESULT — RU
# =========================================================

def build_user_result_ru(
    user: dict[str, Any],
) -> str:
    final_rank = user.get(
        "final_rank"
    )

    final_xp = int(
        user.get(
            "final_xp"
        )
        or 0
    )

    if final_rank is None:
        return (
            "В этом сезоне у тебя ещё нет "
            "зафиксированного результата."
        )

    return (
        f"Место: <b>#{final_rank}</b>\n"
        f"Заработано: <b>{final_xp} XP</b>"
    )


# =========================================================
# USER RESULT — UK
# =========================================================

def build_user_result_uk(
    user: dict[str, Any],
) -> str:
    final_rank = user.get(
        "final_rank"
    )

    final_xp = int(
        user.get(
            "final_xp"
        )
        or 0
    )

    if final_rank is None:
        return (
            "У цьому сезоні в тебе ще немає "
            "зафіксованого результату."
        )

    return (
        f"Місце: <b>#{final_rank}</b>\n"
        f"Зароблено: <b>{final_xp} XP</b>"
    )


# =========================================================
# USER RESULT — EN
# =========================================================

def build_user_result_en(
    user: dict[str, Any],
) -> str:
    final_rank = user.get(
        "final_rank"
    )

    final_xp = int(
        user.get(
            "final_xp"
        )
        or 0
    )

    if final_rank is None:
        return (
            "You don't have a recorded result "
            "for this season yet."
        )

    return (
        f"Rank: <b>#{final_rank}</b>\n"
        f"Earned: <b>{final_xp} XP</b>"
    )


# =========================================================
# MESSAGE — RU
# =========================================================

def build_message_ru(
    user: dict[str, Any],
    season_data: dict[str, Any],
) -> str:
    top3 = (
        season_data.get(
            "top3"
        )
        or []
    )

    summary = (
        season_data.get(
            "summary"
        )
        or {}
    )

    top3_text = (
        build_top3_lines(
            top3
        )
    )

    user_result = (
        build_user_result_ru(
            user
        )
    )

    best_streak = int(
        summary.get(
            "best_streak"
        )
        or 0
    )

    best_streak_user = (
        safe_text(
            summary.get(
                "best_streak_user"
            ),
            fallback="—",
        )
    )

    popular_habit = (
        safe_text(
            summary.get(
                "popular_habit"
            ),
            fallback="—",
        )
    )

    popular_habit_user = (
        safe_text(
            summary.get(
                "popular_habit_user"
            ),
            fallback="—",
        )
    )

    return (
        "🏆 <b>СЕЗОН 1 ЗАВЕРШЁН</b>\n"
        "\n"
        "Первый сезон подошёл к концу. "
        "Время подвести итоги 🔥\n"
        "\n"

        "🏅 <b>Победители сезона</b>\n"
        f"{top3_text}\n"
        "\n"

        "🎁 <b>Награда за 1 место</b>\n"
        "Победитель сезона получает "
        "<b>персональный аватар</b>, "
        "созданный специально для него.\n"
        "\n"

        "📊 <b>Твой результат</b>\n"
        f"{user_result}\n"
        "\n"

        "🔥 <b>Самый большой стрик сезона</b>\n"
        f"<b>{best_streak} дней</b> — "
        f"{best_streak_user}\n"
        "\n"

        "⭐ <b>Привычка сезона</b>\n"
        f"«{popular_habit}» — "
        f"{popular_habit_user}\n"
        "\n"

        "📚 Позже подробную информацию "
        "о прошедших сезонах можно будет "
        "посмотреть в:\n"
        "<b>Профиль → Игровые показатели → "
        "История сезонов</b>\n"
        "\n"

        "🚀 <b>НОВЫЙ СЕЗОН — 1 СЕНТЯБРЯ</b>\n"
        "\n"

        "В новом сезоне будет ещё больше "
        "наград за передовые места и "
        "отдельные достижения для самых "
        "целеустремлённых.\n"
        "\n"

        "Новый сезон. Новая борьба. "
        "Все начинают с нуля 🔥"
    )


# =========================================================
# MESSAGE — UK
# =========================================================

def build_message_uk(
    user: dict[str, Any],
    season_data: dict[str, Any],
) -> str:
    top3 = (
        season_data.get(
            "top3"
        )
        or []
    )

    summary = (
        season_data.get(
            "summary"
        )
        or {}
    )

    top3_text = (
        build_top3_lines(
            top3
        )
    )

    user_result = (
        build_user_result_uk(
            user
        )
    )

    best_streak = int(
        summary.get(
            "best_streak"
        )
        or 0
    )

    best_streak_user = (
        safe_text(
            summary.get(
                "best_streak_user"
            ),
            fallback="—",
        )
    )

    popular_habit = (
        safe_text(
            summary.get(
                "popular_habit"
            ),
            fallback="—",
        )
    )

    popular_habit_user = (
        safe_text(
            summary.get(
                "popular_habit_user"
            ),
            fallback="—",
        )
    )

    return (
        "🏆 <b>СЕЗОН 1 ЗАВЕРШЕНО</b>\n"
        "\n"
        "Перший сезон добіг кінця. "
        "Час підбити підсумки 🔥\n"
        "\n"

        "🏅 <b>Переможці сезону</b>\n"
        f"{top3_text}\n"
        "\n"

        "🎁 <b>Нагорода за 1 місце</b>\n"
        "Переможець сезону отримує "
        "<b>персональний аватар</b>, "
        "створений спеціально для нього.\n"
        "\n"

        "📊 <b>Твій результат</b>\n"
        f"{user_result}\n"
        "\n"

        "🔥 <b>Найбільший стрік сезону</b>\n"
        f"<b>{best_streak} днів</b> — "
        f"{best_streak_user}\n"
        "\n"

        "⭐ <b>Звичка сезону</b>\n"
        f"«{popular_habit}» — "
        f"{popular_habit_user}\n"
        "\n"

        "📚 Згодом детальну інформацію "
        "про минулі сезони можна буде "
        "переглянути тут:\n"
        "<b>Профіль → Ігрові показники → "
        "Історія сезонів</b>\n"
        "\n"

        "🚀 <b>НОВИЙ СЕЗОН — 1 ВЕРЕСНЯ</b>\n"
        "\n"

        "У новому сезоні буде ще більше "
        "нагород за провідні місця та "
        "окремі досягнення для "
        "найцілеспрямованіших.\n"
        "\n"

        "Новий сезон. Нова боротьба. "
        "Усі починають з нуля 🔥"
    )


# =========================================================
# MESSAGE — EN
# =========================================================

def build_message_en(
    user: dict[str, Any],
    season_data: dict[str, Any],
) -> str:
    top3 = (
        season_data.get(
            "top3"
        )
        or []
    )

    summary = (
        season_data.get(
            "summary"
        )
        or {}
    )

    top3_text = (
        build_top3_lines(
            top3
        )
    )

    user_result = (
        build_user_result_en(
            user
        )
    )

    best_streak = int(
        summary.get(
            "best_streak"
        )
        or 0
    )

    best_streak_user = (
        safe_text(
            summary.get(
                "best_streak_user"
            ),
            fallback="—",
        )
    )

    popular_habit = (
        safe_text(
            summary.get(
                "popular_habit"
            ),
            fallback="—",
        )
    )

    popular_habit_user = (
        safe_text(
            summary.get(
                "popular_habit_user"
            ),
            fallback="—",
        )
    )

    return (
        "🏆 <b>SEASON 1 IS OVER</b>\n"
        "\n"
        "The first season has come to an end. "
        "Time to see the results 🔥\n"
        "\n"

        "🏅 <b>Season winners</b>\n"
        f"{top3_text}\n"
        "\n"

        "🎁 <b>1st place reward</b>\n"
        "The season winner receives a "
        "<b>personal avatar</b> created "
        "especially for them.\n"
        "\n"

        "📊 <b>Your result</b>\n"
        f"{user_result}\n"
        "\n"

        "🔥 <b>Longest streak of the season</b>\n"
        f"<b>{best_streak} days</b> — "
        f"{best_streak_user}\n"
        "\n"

        "⭐ <b>Habit of the season</b>\n"
        f"“{popular_habit}” — "
        f"{popular_habit_user}\n"
        "\n"

        "📚 Later, detailed information "
        "about previous seasons will be "
        "available in:\n"
        "<b>Profile → Game Stats → "
        "Season History</b>\n"
        "\n"

        "🚀 <b>NEW SEASON — SEPTEMBER 1</b>\n"
        "\n"

        "The new season will bring even "
        "more rewards for top positions "
        "and special achievements for "
        "the most determined players.\n"
        "\n"

        "New season. New competition. "
        "Everyone starts from zero 🔥"
    )


# =========================================================
# GET MESSAGE
# =========================================================

def get_message_text(
    language: str | None,
    user: dict[str, Any],
    season_data: dict[str, Any],
) -> str:
    safe_language = (
        normalize_language(
            language
        )
    )

    if safe_language == "uk":
        return build_message_uk(
            user=user,
            season_data=
                season_data,
        )

    if safe_language == "en":
        return build_message_en(
            user=user,
            season_data=
                season_data,
        )

    return build_message_ru(
        user=user,
        season_data=
            season_data,
    )


# =========================================================
# SEND TO USER
# =========================================================

async def send_message_to_user(
    bot: Bot,
    user: dict[str, Any],
    season_data: dict[str, Any],
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
            user=user,
            season_data=
                season_data,
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
            f"🏆 rank: "
            f"{user['final_rank']}"
        )
        print(
            f"⭐ XP: "
            f"{user['final_xp']}"
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

async def broadcast_season_results() -> None:
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
        # COMMON SEASON DATA
        # =================================================

        season_data = (
            await get_season_summary()
        )

        top3 = (
            season_data.get(
                "top3"
            )
            or []
        )

        summary = (
            season_data.get(
                "summary"
            )
            or {}
        )


        print()
        print(
            "========================================="
        )
        print(
            f"🏆 ИТОГИ СЕЗОНА "
            f"{SEASON_NUMBER}"
        )
        print(
            "========================================="
        )

        for player in top3:
            print(
                f"#{player['rank']} "
                f"{player['nickname']} — "
                f"{player['season_xp']} XP"
            )

        print(
            f"🔥 Стрик: "
            f"{summary.get('best_streak')} — "
            f"{summary.get('best_streak_user')}"
        )

        print(
            f"⭐ Привычка: "
            f"{summary.get('popular_habit')} — "
            f"{summary.get('popular_habit_user')}"
        )

        print(
            "========================================="
        )
        print()


        # =================================================
        # USERS
        # =================================================

        users = (
            await get_all_users(
                season_number=
                    SEASON_NUMBER
            )
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
                    season_data=
                        season_data,
                )
            )


            if result == "sent":
                sent += 1

                sent_by_language[
                    language
                ] += 1

                if not DRY_RUN:
                    print(
                        f"✅ [{index}/{total}] "
                        f"Отправлено: "
                        f"{user['telegram_id']} "
                        f"[{language}] "
                        f"rank="
                        f"{user['final_rank']}"
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
        broadcast_season_results()
    )