from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from pydantic import BaseModel

from backend.api.dependencies import (
    CurrentUser,
)

from backend.services.profile import (
    change_nickname,
    get_profile,
)


router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
)


# =========================================================
# СХЕМЫ ЗАПРОСОВ
# =========================================================

class UpdateNicknameRequest(BaseModel):
    nickname: str


# =========================================================
# ПОЛУЧИТЬ ПРОФИЛЬ
# =========================================================

@router.get("")
async def read_profile(
    user: CurrentUser,
):
    profile = await get_profile(
        user_id=user["id"],
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль пользователя не найден",
        )

    return profile


# =========================================================
# ИЗМЕНИТЬ NICKNAME
# =========================================================

@router.patch("/nickname")
async def update_profile_nickname(
    payload: UpdateNicknameRequest,
    user: CurrentUser,
):
    try:
        result = await change_nickname(
            user_id=user["id"],
            nickname=payload.nickname,
        )

        return result

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )