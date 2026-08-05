from typing import Annotated, TypeAlias

import asyncpg
from fastapi import (
    Depends,
    Header,
)

from backend.repositories.users import (
    create_user,
    get_user_by_telegram_id,
)
from backend.services.telegram_auth import (
    validate_telegram_init_data,
)


async def get_current_user(
    x_telegram_init_data: Annotated[
        str | None,
        Header(
            alias="X-Telegram-Init-Data",
        ),
    ] = None,
) -> asyncpg.Record:
    telegram_user = validate_telegram_init_data(
        x_telegram_init_data
    )

    telegram_id = int(
        telegram_user["id"]
    )

    user = await get_user_by_telegram_id(
        telegram_id
    )

    if user is not None:
        return user

    return await create_user(
        telegram_id=telegram_id,
        username=telegram_user.get(
            "username"
        ),
        first_name=telegram_user.get(
            "first_name"
        ),
    )


CurrentUser: TypeAlias = Annotated[
    asyncpg.Record,
    Depends(get_current_user),
]