from aiogram.types import User

from backend.repositories.users import (
    create_user,
    get_user_by_telegram_id,
    update_user,
)

from backend.services.referral import (
    process_referral,
)


# ============================================================================
# Регистрация и обновление пользователя
# ============================================================================

async def register_user(
    user: User,
    inviter_telegram_id: int | None = None,
):
    db_user = await get_user_by_telegram_id(user.id)

    # ------------------------------------------------------------------------
    # Новый пользователь
    # ------------------------------------------------------------------------

    if db_user is None:
        db_user = await create_user(
            telegram_id=user.id,
            username=user.username,
            first_name=user.first_name,
        )

        print(
            f"🆕 Новый пользователь | "
            f"Присвоено: {db_user['nickname']} | "
            f"Telegram ID: {user.id}"
        )

        # --------------------------------------------------------------------
        # Реферальное приглашение.
        #
        # Обрабатывается только при первой регистрации.
        # --------------------------------------------------------------------

        referral = await process_referral(
            invited_user_id=db_user["id"],
            invited_telegram_id=user.id,
            inviter_telegram_id=inviter_telegram_id,
        )

        return {
            "user": db_user,
            "referral": referral,
        }

    # ------------------------------------------------------------------------
    # Существующий пользователь
    # ------------------------------------------------------------------------

    db_user = await update_user(
        telegram_id=user.id,
        username=user.username,
        first_name=user.first_name,
    )

    return {
        "user": db_user,
        "referral": None,
    }