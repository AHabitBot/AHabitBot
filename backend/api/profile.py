from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from backend.api.dependencies import (
    CurrentUser,
)

from backend.services.profile.profile_service import (
    get_profile,
)


router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
)


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
