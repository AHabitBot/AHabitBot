from aiogram import Bot

from config import BOT_TOKEN
from backend.i18n.notifications import achievement_text, normalize_language


# =========================================================
# ACHIEVEMENT NOTIFICATIONS
# =========================================================


# =========================================================
# СКЛОНЕНИЕ "ДЕНЬ"
# =========================================================

def get_days_label(
    value: int,
) -> str:
    last_two = value % 100
    last = value % 10

    if 11 <= last_two <= 14:
        return "дней"

    if last == 1:
        return "день"

    if 2 <= last <= 4:
        return "дня"

    return "дней"


# =========================================================
# СКЛОНЕНИЕ "ПОДТВЕРЖДЕНИЕ"
# =========================================================

def get_confirmations_label(
    value: int,
) -> str:
    last_two = value % 100
    last = value % 10

    if 11 <= last_two <= 14:
        return "подтверждений"

    if last == 1:
        return "подтверждение"

    if 2 <= last <= 4:
        return "подтверждения"

    return "подтверждений"


# =========================================================
# СКЛОНЕНИЕ "ДРУГ"
# =========================================================

def get_friends_label(
    value: int,
) -> str:
    last_two = value % 100
    last = value % 10

    if 11 <= last_two <= 14:
        return "друзей"

    if last == 1:
        return "друг"

    if 2 <= last <= 4:
        return "друга"

    return "друзей"


# =========================================================
# ОТПРАВИТЬ TELEGRAM-СООБЩЕНИЕ
# =========================================================

async def _send_achievement_message(
    telegram_id: int,
    text: str,
    log_label: str,
) -> bool:
    """
    Внутренняя функция отправки.

    Ошибка Telegram не должна влиять
    на получение достижения или XP.
    """

    bot = Bot(
        token=BOT_TOKEN
    )

    try:
        await bot.send_message(
            chat_id=telegram_id,
            text=text,
            parse_mode="HTML",
        )

        print(
            "🏆 Уведомление о достижении отправлено | "
            f"Telegram ID: {telegram_id} | "
            f"{log_label}"
        )

        return True

    except Exception as error:
        print(
            "⚠️ Не удалось отправить "
            "уведомление о достижении | "
            f"Telegram ID: {telegram_id} | "
            f"{log_label} | "
            f"Ошибка: {error}"
        )

        return False

    finally:
        await bot.session.close()


# =========================================================
# STREAK — NOTIFICATION
# =========================================================

async def send_streak_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
    language: str = "ru",
) -> bool:
    normalized_targets = sorted({int(x) for x in earned_targets if int(x) > 0})
    if not normalized_targets:
        return False
    text = achievement_text("streak", normalized_targets, total_xp_reward, next_target, normalize_language(language))
    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=f"Streak targets: {normalized_targets} | +{total_xp_reward} XP",
    )


async def send_confirmation_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
    language: str = "ru",
) -> bool:
    normalized_targets = sorted({int(x) for x in earned_targets if int(x) > 0})
    if not normalized_targets:
        return False
    text = achievement_text("confirmation", normalized_targets, total_xp_reward, next_target, normalize_language(language))
    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=f"Confirmation targets: {normalized_targets} | +{total_xp_reward} XP",
    )


async def send_invitation_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
    language: str = "ru",
) -> bool:
    normalized_targets = sorted({int(x) for x in earned_targets if int(x) > 0})
    if not normalized_targets:
        return False
    text = achievement_text("invitation", normalized_targets, total_xp_reward, next_target, normalize_language(language))
    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=f"Invitation targets: {normalized_targets} | +{total_xp_reward} XP",
    )
