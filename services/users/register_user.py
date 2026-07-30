from aiogram.types import User

from repositories.users import (
    get_user_by_telegram_id,
    create_user,
    update_user,
)
from repositories.stats import create_stats


async def register_user(user: User):
    db_user = await get_user_by_telegram_id(user.id)

    if db_user is None:
        db_user = await create_user(
            telegram_id=user.id,
            username=user.username,
            first_name=user.first_name,
        )

        await create_stats(db_user["id"])

        return db_user

    db_user = await update_user(
        telegram_id=user.id,
        username=user.username,
        first_name=user.first_name,
    )

    return db_user