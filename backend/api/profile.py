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
    change_profile_appearance,
    get_profile,
)

from backend.repositories.referral import (
    get_referral_stats,
)

from backend.services.achievements.achievements_service import (
    get_achievements,
)

from backend.services.stats import (
    get_profile_season_history,
    get_profile_stats,
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


class UpdateAppearanceRequest(BaseModel):
    avatar_key: str
    background_key: str


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
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Профиль пользователя не найден",
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
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                str(error),
        )


# =========================================================
# ИЗМЕНИТЬ ВНЕШНИЙ ВИД
# =========================================================

@router.patch("/appearance")
async def update_profile_appearance_endpoint(
    payload: UpdateAppearanceRequest,
    user: CurrentUser,
):
    try:
        result = (
            await change_profile_appearance(
                user_id=user["id"],
                avatar_key=
                    payload.avatar_key,
                background_key=
                    payload.background_key,
            )
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                str(error),
        )


# =========================================================
# ПОЛУЧИТЬ РЕФЕРАЛЬНЫЕ ДАННЫЕ
# =========================================================

@router.get("/referral")
async def read_profile_referral(
    user: CurrentUser,
):
    stats = await get_referral_stats(
        inviter_user_id=user["id"],
    )

    return {
        "referral_link":
            user["referral_link"],

        "invited_count": (
            int(
                stats["invited_count"]
            )
            if stats
            else 0
        ),

        "earned_xp": (
            int(
                stats["earned_xp"]
            )
            if stats
            else 0
        ),
    }


# =========================================================
# ПОЛУЧИТЬ ДОСТИЖЕНИЯ
# =========================================================

@router.get("/achievements")
async def read_profile_achievements(
    user: CurrentUser,
):
    achievements = await get_achievements(
        user_id=user["id"],
    )

    return achievements


# =========================================================
# ПОЛУЧИТЬ ИГРОВЫЕ ПОКАЗАТЕЛИ
# =========================================================

@router.get("/stats")
async def read_profile_stats(
    user: CurrentUser,
    period: str = "week",
):
    try:
        stats_data = await get_profile_stats(
            user_id=user["id"],
            period=period,
        )

        return stats_data

    except ValueError as error:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                str(error),
        )

# =========================================================
# ИСТОРИЯ СЕЗОНОВ
# =========================================================

@router.get("/season-history")
async def read_profile_season_history(
    user: CurrentUser,
):
    return await get_profile_season_history(
        user_id=user["id"],
    )
