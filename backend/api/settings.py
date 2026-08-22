from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from pydantic import BaseModel

from backend.api.dependencies import (
    CurrentUser,
)

from backend.repositories.settings import (
    get_user_settings,
    set_reminders_enabled,
    set_user_timezone,
    set_user_theme,
    set_user_language,
)


router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
)


# =========================================================
# ДОСТУПНЫЕ ЧАСОВЫЕ ПОЯСА MVP
# =========================================================

ALLOWED_TIMEZONES = {
    "Europe/Berlin",
    "Europe/Warsaw",
    "Europe/Kyiv",
    "Europe/Moscow",
    "Europe/Oslo",
    "America/New_York",
}


# =========================================================
# REQUEST MODELS
# =========================================================

class RemindersUpdateRequest(
    BaseModel
):
    enabled: bool


class TimezoneUpdateRequest(
    BaseModel
):
    timezone: str


class ThemeUpdateRequest(
    BaseModel
):
    theme: str


class LanguageUpdateRequest(
    BaseModel
):
    language: str


# =========================================================
# ПОЛУЧИТЬ НАСТРОЙКИ
# =========================================================

@router.get("")
async def read_settings(
    user: CurrentUser,
):
    settings = await get_user_settings(
        user_id=user["id"],
    )

    return settings


# =========================================================
# ВКЛЮЧИТЬ / ВЫКЛЮЧИТЬ НАПОМИНАНИЯ
# =========================================================

@router.patch("/reminders")
async def update_reminders(
    payload: RemindersUpdateRequest,
    user: CurrentUser,
):
    settings = await set_reminders_enabled(
        user_id=user["id"],
        enabled=payload.enabled,
    )

    return settings


# =========================================================
# ИЗМЕНИТЬ ЧАСОВОЙ ПОЯС
# =========================================================

@router.patch("/timezone")
async def update_timezone(
    payload: TimezoneUpdateRequest,
    user: CurrentUser,
):
    timezone = (
        payload.timezone
        .strip()
    )

    if (
        timezone
        not in ALLOWED_TIMEZONES
    ):
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                "Недоступный часовой пояс",
        )

    settings = await set_user_timezone(
        user_id=user["id"],
        timezone=timezone,
    )

    return settings

# =========================================================
# ИЗМЕНИТЬ ТЕМУ
# =========================================================

@router.patch("/theme")
async def update_theme(
    payload: ThemeUpdateRequest,
    user: CurrentUser,
):
    theme = payload.theme.strip().lower()

    if theme not in {"light", "dark"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недоступная тема",
        )

    return await set_user_theme(
        user_id=user["id"],
        theme=theme,
    )


# =========================================================
# ИЗМЕНИТЬ ЯЗЫК
# =========================================================

@router.patch("/language")
async def update_language(
    payload: LanguageUpdateRequest,
    user: CurrentUser,
):
    language = (
        payload.language
        .strip()
        .lower()
    )

    if language not in {"ru", "uk", "en"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недоступный язык",
        )

    return await set_user_language(
        user_id=user["id"],
        language=language,
    )
