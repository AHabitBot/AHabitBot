from typing import Annotated, TypeAlias

import asyncpg

from backend.database.database import get_connection
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
from backend.i18n.notifications import normalize_language
from backend.repositories.settings import set_user_timezone
from backend.services.settings import normalize_timezone


async def get_current_user(
    x_telegram_init_data: Annotated[
        str | None,
        Header(
            alias="X-Telegram-Init-Data",
        ),
    ] = None,
    x_client_timezone: Annotated[
        str | None,
        Header(
            alias="X-Client-Timezone",
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
        detected_timezone = normalize_timezone(
            x_client_timezone,
            fallback=None,
        )

        if detected_timezone is not None:
            async with get_connection() as connection:
                timezone_is_missing = await connection.fetchval(
                    """
                    SELECT timezone IS NULL
                    FROM user_settings
                    WHERE user_id = $1
                    """,
                    user["id"],
                )

            if timezone_is_missing:
                await set_user_timezone(
                    user_id=user["id"],
                    timezone=detected_timezone,
                )

        return user

    return await create_user(
        telegram_id=telegram_id,
        username=telegram_user.get(
            "username"
        ),
        first_name=telegram_user.get(
            "first_name"
        ),
        language=normalize_language(
            telegram_user.get("language_code")
        ),
        timezone=normalize_timezone(
            x_client_timezone,
            fallback=None,
        ),
    )


CurrentUser: TypeAlias = Annotated[
    asyncpg.Record,
    Depends(get_current_user),
]