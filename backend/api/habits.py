from typing import Annotated, Literal

from fastapi import (
    APIRouter,
    Header,
    HTTPException,
    status,
)
from pydantic import BaseModel, Field

from backend.repositories.habits import (
    create_habit,
    get_user_habits,
)

from backend.repositories.users import (
    get_user_by_telegram_id,
    create_user,
)

from backend.services.telegram_auth import (
    validate_telegram_init_data,
)


router = APIRouter(
    prefix="/api/habits",
    tags=["habits"],
)


class HabitCreateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=60,
    )
    emoji: str = Field(
        default="✱",
        min_length=1,
        max_length=20,
    )
    color: str = Field(
        default="blue",
        min_length=1,
        max_length=30,
    )
    size: Literal["large"] = "large"


async def get_current_user(
    x_telegram_init_data: Annotated[
        str | None,
        Header(alias="X-Telegram-Init-Data"),
    ] = None,
):
    telegram_user = validate_telegram_init_data(
        x_telegram_init_data
    )

    telegram_id = telegram_user["id"]

    user = await get_user_by_telegram_id(
        telegram_id
    )

    if user is None:
        user = await create_user(
            telegram_id=telegram_id,
            username=telegram_user.get(
                "username"
            ),
            first_name=telegram_user.get(
                "first_name"
            ),
        )

    return user



@router.get("")
async def read_habits(
    x_telegram_init_data: Annotated[
        str | None,
        Header(alias="X-Telegram-Init-Data"),
    ] = None,
):
    user = await get_current_user(
        x_telegram_init_data
    )

    habits = await get_user_habits(
        user["id"]
    )

    return {
        "habits": habits,
    }


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def add_habit(
    payload: HabitCreateRequest,
    x_telegram_init_data: Annotated[
        str | None,
        Header(alias="X-Telegram-Init-Data"),
    ] = None,
):
    user = await get_current_user(
        x_telegram_init_data
    )

    habit = await create_habit(
        user_id=user["id"],
        title=payload.title.strip(),
        emoji=payload.emoji,
        color=payload.color,
        size=payload.size,
    )

    return {
        "habit": habit,
    }