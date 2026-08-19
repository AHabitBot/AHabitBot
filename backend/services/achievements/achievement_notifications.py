from aiogram import Bot

from config import BOT_TOKEN


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
# STREAK — УВЕДОМЛЕНИЕ
# =========================================================

async def send_streak_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
) -> bool:
    """
    Уведомление о streak-достижениях.
    """

    normalized_targets = sorted(
        {
            int(target)
            for target in earned_targets
            if int(target) > 0
        }
    )

    if not normalized_targets:
        return False

    # =====================================================
    # ОДНО ДОСТИЖЕНИЕ
    # =====================================================

    if len(normalized_targets) == 1:
        target = normalized_targets[0]

        text = (
            "🏆 <b>Новое достижение!</b>\n\n"
            "🔥 Серия — "
            f"<b>{target} "
            f"{get_days_label(target)}</b>\n"
            f"⭐ <b>+{total_xp_reward} XP</b>"
        )

    # =====================================================
    # НЕСКОЛЬКО ДОСТИЖЕНИЙ
    # =====================================================

    else:
        achievements_text = "\n".join(
            (
                "🔥 Серия — "
                f"<b>{target} "
                f"{get_days_label(target)}</b>"
            )
            for target in normalized_targets
        )

        text = (
            "🏆 <b>Получены достижения!</b>\n\n"
            f"{achievements_text}\n\n"
            f"⭐ <b>+{total_xp_reward} XP</b> начислено"
        )

    # =====================================================
    # СЛЕДУЮЩАЯ ЦЕЛЬ
    # =====================================================

    if next_target is not None:
        text += (
            "\n\n"
            "Следующая цель — "
            f"<b>{next_target} "
            f"{get_days_label(next_target)}</b>"
        )

    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=(
            f"Streak targets: "
            f"{normalized_targets} | "
            f"+{total_xp_reward} XP"
        ),
    )


# =========================================================
# CONFIRMATIONS — УВЕДОМЛЕНИЕ
# =========================================================

async def send_confirmation_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
) -> bool:
    """
    Уведомление о достижениях
    за количество подтверждений привычек.
    """

    normalized_targets = sorted(
        {
            int(target)
            for target in earned_targets
            if int(target) > 0
        }
    )

    if not normalized_targets:
        return False

    # =====================================================
    # ОДНО ДОСТИЖЕНИЕ
    # =====================================================

    if len(normalized_targets) == 1:
        target = normalized_targets[0]

        text = (
            "🏆 <b>Новое достижение!</b>\n\n"
            "✅ Подтверждения — "
            f"<b>{target}</b>\n"
            f"⭐ <b>+{total_xp_reward} XP</b>"
        )

    # =====================================================
    # НЕСКОЛЬКО ДОСТИЖЕНИЙ
    # =====================================================

    else:
        achievements_text = "\n".join(
            (
                "✅ Подтверждения — "
                f"<b>{target}</b>"
            )
            for target in normalized_targets
        )

        text = (
            "🏆 <b>Получены достижения!</b>\n\n"
            f"{achievements_text}\n\n"
            f"⭐ <b>+{total_xp_reward} XP</b> начислено"
        )

    # =====================================================
    # СЛЕДУЮЩАЯ ЦЕЛЬ
    # =====================================================

    if next_target is not None:
        text += (
            "\n\n"
            "Следующая цель — "
            f"<b>{next_target} "
            f"{get_confirmations_label(next_target)}</b>"
        )

    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=(
            f"Confirmation targets: "
            f"{normalized_targets} | "
            f"+{total_xp_reward} XP"
        ),
    )


# =========================================================
# INVITATIONS — УВЕДОМЛЕНИЕ
# =========================================================

async def send_invitation_achievement_notification(
    telegram_id: int,
    earned_targets: list[int],
    total_xp_reward: int,
    next_target: int | None = None,
) -> bool:
    """
    Уведомление о достижениях
    за количество приглашённых друзей.
    """

    normalized_targets = sorted(
        {
            int(target)
            for target in earned_targets
            if int(target) > 0
        }
    )

    if not normalized_targets:
        return False

    # =====================================================
    # ОДНО ДОСТИЖЕНИЕ
    # =====================================================

    if len(normalized_targets) == 1:
        target = normalized_targets[0]

        text = (
            "🏆 <b>Новое достижение!</b>\n\n"
            "👥 Приглашения — "
            f"<b>{target} "
            f"{get_friends_label(target)}</b>\n"
            f"⭐ <b>+{total_xp_reward} XP</b>"
        )

    # =====================================================
    # НЕСКОЛЬКО ДОСТИЖЕНИЙ
    # =====================================================

    else:
        achievements_text = "\n".join(
            (
                "👥 Приглашения — "
                f"<b>{target} "
                f"{get_friends_label(target)}</b>"
            )
            for target in normalized_targets
        )

        text = (
            "🏆 <b>Получены достижения!</b>\n\n"
            f"{achievements_text}\n\n"
            f"⭐ <b>+{total_xp_reward} XP</b> начислено"
        )

    # =====================================================
    # СЛЕДУЮЩАЯ ЦЕЛЬ
    # =====================================================

    if next_target is not None:
        text += (
            "\n\n"
            "Следующая цель — "
            f"<b>{next_target} "
            f"{get_friends_label(next_target)}</b>"
        )

    return await _send_achievement_message(
        telegram_id=telegram_id,
        text=text,
        log_label=(
            f"Invitation targets: "
            f"{normalized_targets} | "
            f"+{total_xp_reward} XP"
        ),
    )