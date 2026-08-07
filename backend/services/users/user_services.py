from aiogram.types import User

from backend.repositories.users import (
    create_user,
    get_user_by_telegram_id,
    update_user,
)


# ============================================================================
# Регистрация и обновление пользователя
# ============================================================================

async def register_user(user: User):
    db_user = await get_user_by_telegram_id(user.id)

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

        return db_user

    return await update_user(
        telegram_id=user.id,
        username=user.username,
        first_name=user.first_name,
    )