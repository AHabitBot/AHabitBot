from aiogram import Bot

from config import BOT_TOKEN
from backend.i18n.notifications import level_text, normalize_language


# =========================================================
# LEVEL NOTIFICATIONS
# =========================================================


async def send_level_up_notification(
    telegram_id: int,
    level: int,
    unlocked_avatars_count: int = 0,
    language: str = "ru",
) -> bool:
    """
    Отправляет сообщение о новом максимальном уровне.

    Ошибка Telegram никогда не должна влиять на XP,
    уровень пользователя или разблокировку аватаров.
    """

    level = max(1, int(level))
    unlocked_avatars_count = max(
        0,
        int(unlocked_avatars_count),
    )

    text = level_text(level, unlocked_avatars_count, normalize_language(language))

    bot = Bot(token=BOT_TOKEN)

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=text,
            parse_mode="HTML",
        )

        print(
            "🥳 Уведомление о новом уровне отправлено | "
            f"Telegram ID: {telegram_id} | "
            f"Level: {level} | "
            f"Unlocked avatars: {unlocked_avatars_count}"
        )

        return True

    except Exception as error:
        print(
            "⚠️ Не удалось отправить уведомление "
            "о новом уровне | "
            f"Telegram ID: {telegram_id} | "
            f"Level: {level} | "
            f"Ошибка: {error}"
        )

        return False

    finally:
        await bot.session.close()
