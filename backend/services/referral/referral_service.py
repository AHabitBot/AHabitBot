from backend.repositories.referral import (
    create_referral,
)

from backend.repositories.users import (
    get_user_by_telegram_id,
)

from backend.services.achievements.achievements_service import (
    sync_invitation_achievements,
)


REFERRAL_XP_REWARD = 5


# ============================================================================
# Обработка реферального приглашения
# ============================================================================

async def process_referral(
    invited_user_id: int,
    invited_telegram_id: int,
    inviter_telegram_id: int | None,
):
    """
    Обрабатывает реферальное приглашение.

    Условия:
    - должен быть передан inviter_telegram_id;
    - пользователь не может пригласить сам себя;
    - пригласивший должен существовать;
    - invited_user_id может быть добавлен
      в referrals только один раз.

    После успешного создания referral:
    - проверяются invitation-достижения
      пригласившего пользователя.
    """

    # ========================================================================
    # НЕТ INVITER
    # ========================================================================

    if inviter_telegram_id is None:
        return None


    # ========================================================================
    # ЗАЩИТА ОТ САМОПРИГЛАШЕНИЯ
    # ========================================================================

    if (
        inviter_telegram_id
        ==
        invited_telegram_id
    ):
        print(
            "⚠️ Попытка самоприглашения | "
            f"Telegram ID: "
            f"{invited_telegram_id}"
        )

        return None


    # ========================================================================
    # ИЩЕМ ПРИГЛАСИВШЕГО
    # ========================================================================

    inviter = await get_user_by_telegram_id(
        inviter_telegram_id
    )

    if inviter is None:
        print(
            "⚠️ Пригласивший пользователь "
            "не найден | "
            f"Telegram ID: "
            f"{inviter_telegram_id}"
        )

        return None


    inviter_user_id = int(
        inviter["id"]
    )


    # ========================================================================
    # СОЗДАЁМ РЕФЕРАЛЬНУЮ СВЯЗЬ
    # ========================================================================

    referral = await create_referral(
        inviter_user_id=
            inviter_user_id,

        invited_user_id=
            invited_user_id,

        xp_amount=
            REFERRAL_XP_REWARD,
    )


    # ========================================================================
    # REFERRAL УЖЕ СУЩЕСТВУЕТ
    #
    # В этом случае:
    # - +5 XP повторно не начисляются;
    # - invitation achievement повторно
    #   не проверяем.
    # ========================================================================

    if referral is None:
        return None


    # ========================================================================
    # ЛОГ УСПЕШНОГО ПРИГЛАШЕНИЯ
    # ========================================================================

    print(
        "🎁 Реферальное приглашение создано | "
        f"Inviter Telegram ID: "
        f"{inviter_telegram_id} | "
        f"Invited Telegram ID: "
        f"{invited_telegram_id} | "
        f"+{REFERRAL_XP_REWARD} XP"
    )


    # ========================================================================
    # INVITATION ACHIEVEMENTS
    #
    # ВАЖНО:
    # запускаем только ПОСЛЕ успешного
    # создания referral.
    #
    # К этому моменту запись уже существует
    # в таблице referrals, поэтому
    # sync_invitation_achievements()
    # увидит актуальный COUNT(*).
    # ========================================================================

    try:
        newly_earned = (
            await sync_invitation_achievements(
                user_id=
                    inviter_user_id,
            )
        )

        if newly_earned:
            print(
                "🏆 Invitation-достижения "
                "получены | "
                f"Inviter user ID: "
                f"{inviter_user_id} | "
                f"Count: "
                f"{len(newly_earned)}"
            )

    except Exception as error:
        # --------------------------------------------------------------------
        # Ошибка achievements не должна
        # отменять уже созданный referral.
        #
        # Сам referral и стандартные +5 XP
        # уже сохранены в БД.
        # --------------------------------------------------------------------

        print(
            "⚠️ Ошибка проверки "
            "invitation-достижений | "
            f"Inviter user ID: "
            f"{inviter_user_id} | "
            f"Ошибка: {error}"
        )


    # ========================================================================
    # RESPONSE
    # ========================================================================

    return referral