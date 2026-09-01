import logging
from typing import Literal

from fastapi import (
    APIRouter,
    HTTPException,
    status,
)

from backend.api.dependencies import (
    CurrentUser,
)

from pydantic import BaseModel, Field

from backend.repositories.habits import (
    create_habit,
    get_user_habits,
)

from backend.services.habits.habit_service import (
    archive_user_habit,
    edit_habit,
    get_user_archived_habits,
    restore_user_habit,
    update_habit_confirmation,
)


# Используем логгер Uvicorn, чтобы сообщения гарантированно
# попадали в существующий файл api.log.
logger = logging.getLogger(
    "uvicorn.error"
)


router = APIRouter(
    prefix="/api/habits",
    tags=["habits"],
)


# =========================================================
# СХЕМЫ ЗАПРОСОВ
# =========================================================

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
    repeat_type: Literal["days", "weekly", "challenge"] = "days"
    repeat_days: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6, 7])
    weekly_target: int | None = None
    challenge_target: int | None = None


class HabitUpdateRequest(BaseModel):
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
    repeat_type: Literal["days", "weekly", "challenge"] = "days"
    repeat_days: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6, 7])
    weekly_target: int | None = None
    challenge_target: int | None = None


class HabitConfirmationRequest(BaseModel):
    is_confirmed: bool


# =========================================================
# ПОЛУЧИТЬ АКТИВНЫЕ ПРИВЫЧКИ
# =========================================================

@router.get("")
async def read_habits(
    user: CurrentUser,
):
    result = await get_user_habits(
        user["id"]
    )

    return result


# =========================================================
# ПОЛУЧИТЬ АРХИВНЫЕ ПРИВЫЧКИ
# =========================================================

@router.get("/archived")
async def read_archived_habits(
    user: CurrentUser,
):
    """
    Возвращает архивные привычки пользователя.

    Архив не загружается через bootstrap.
    Этот endpoint вызывается только тогда,
    когда пользователь впервые открывает
    страницу Архива привычек.
    """

    try:
        habits = (
            await get_user_archived_habits(
                user_id=user["id"],
            )
        )

        return {
            "habits": habits,
        }

    except Exception:
        logger.exception(
            "\n"
            "==================================================\n"
            "Ошибка при получении архива привычек\n\n"
            "Пользователь : %s\n"
            "==================================================",
            user["id"],
        )

        raise


# =========================================================
# СОЗДАТЬ ПРИВЫЧКУ
#
# Создание сейчас не логируем,
# потому что пользователь просил логировать только:
# - подтверждение;
# - отмену подтверждения;
# - редактирование;
# - архивирование;
# - восстановление;
# - ошибки этих операций.
# =========================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def add_habit(
    payload: HabitCreateRequest,

    user: CurrentUser,
):
    from backend.services.habits.repeat_rules import normalize_repeat_rule
    try:
        repeat_type, repeat_days, weekly_target, challenge_target = normalize_repeat_rule(
            payload.repeat_type, payload.repeat_days, payload.weekly_target, payload.challenge_target
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    habit = await create_habit(
        user_id=user["id"],
        title=payload.title.strip(),
        emoji=payload.emoji,
        color=payload.color,
        size=payload.size,
        repeat_type=repeat_type,
        repeat_days=repeat_days,
        weekly_target=weekly_target,
        challenge_target=challenge_target,
    )

    return {
        "habit": habit,
    }


# =========================================================
# РЕДАКТИРОВАТЬ ПРИВЫЧКУ
# =========================================================

@router.patch("/{habit_id}")
async def update_existing_habit(
    habit_id: int,
    payload: HabitUpdateRequest,

    user: CurrentUser,
):
    try:
        from backend.services.habits.repeat_rules import normalize_repeat_rule
        repeat_type, repeat_days, weekly_target, challenge_target = normalize_repeat_rule(
            payload.repeat_type, payload.repeat_days, payload.weekly_target, payload.challenge_target
        )
        habit = await edit_habit(
            user_id=user["id"],
            habit_id=habit_id,
            title=payload.title.strip(),
            emoji=payload.emoji,
            color=payload.color,
            size=payload.size,
            repeat_type=repeat_type,
            repeat_days=repeat_days,
            weekly_target=weekly_target,
            challenge_target=challenge_target,
        )

        if habit is None:
            logger.warning(
                "\n"
                "==================================================\n"
                "Попытка отредактировать несуществующую привычку\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "==================================================",
                user["id"],
                habit_id,
            )

            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    "Привычка не найдена",
            )

        logger.info(
            "\n"
            "==================================================\n"
            "Пользователь отредактировал привычку\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        return {
            "habit": habit,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception:
        logger.exception(
            "\n"
            "==================================================\n"
            "Ошибка при редактировании привычки\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        raise


# =========================================================
# АРХИВИРОВАТЬ ПРИВЫЧКУ
# =========================================================

@router.patch("/{habit_id}/archive")
async def archive_habit_endpoint(
    habit_id: int,

    user: CurrentUser,
):
    try:
        archived = await archive_user_habit(
            user_id=user["id"],
            habit_id=habit_id,
        )

        if not archived:
            logger.warning(
                "\n"
                "==================================================\n"
                "Попытка архивировать несуществующую привычку\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "==================================================",
                user["id"],
                habit_id,
            )

            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    "Привычка не найдена",
            )

        logger.info(
            "\n"
            "==================================================\n"
            "Пользователь архивировал привычку\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        return {
            "success": True,
            "habit_id": habit_id,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    except Exception:
        logger.exception(
            "\n"
            "==================================================\n"
            "Ошибка при архивировании привычки\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        raise


# =========================================================
# ВОССТАНОВИТЬ ПРИВЫЧКУ ИЗ АРХИВА
# =========================================================

@router.post("/{habit_id}/restore")
async def restore_habit_endpoint(
    habit_id: int,

    user: CurrentUser,
):
    """
    Возвращает архивную привычку
    обратно в список активных.

    История подтверждений,
    XP и лучший стрик сохраняются.
    """

    try:
        habit = await restore_user_habit(
            user_id=user["id"],
            habit_id=habit_id,
        )

        if habit is None:
            logger.warning(
                "\n"
                "==================================================\n"
                "Попытка восстановить несуществующую "
                "или активную привычку\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "==================================================",
                user["id"],
                habit_id,
            )

            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    "Архивная привычка не найдена",
            )

        logger.info(
            "\n"
            "==================================================\n"
            "Пользователь восстановил привычку из архива\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        return {
            "success": True,
            "habit": habit,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "\n"
            "==================================================\n"
            "Ошибка при восстановлении привычки из архива\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            user["id"],
            habit_id,
        )

        raise


# =========================================================
# ПОДТВЕРДИТЬ ИЛИ ОТМЕНИТЬ ПОДТВЕРЖДЕНИЕ
# =========================================================

@router.put("/{habit_id}/confirmation")
async def set_confirmation(
    habit_id: int,
    payload: HabitConfirmationRequest,

    user: CurrentUser,
):
    try:
        result = (
            await update_habit_confirmation(
                user_id=user["id"],
                habit_id=habit_id,
                is_confirmed=
                    payload.is_confirmed,
            )
        )

        if result is None:
            action_text = (
                "подтвердить"
                if payload.is_confirmed
                else
                "отменить подтверждение"
            )

            logger.warning(
                "\n"
                "==================================================\n"
                "Попытка %s несуществующей привычки\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "==================================================",
                action_text,
                user["id"],
                habit_id,
            )

            raise HTTPException(
                status_code=
                    status.HTTP_404_NOT_FOUND,

                detail=
                    "Привычка не найдена",
            )

        habit_result = result.get(
            "habit",
            {},
        )

        confirmation_date = (
            habit_result.get(
                "confirmation_date"
            )
        )

        xp_awarded = bool(
            habit_result.get(
                "xp_awarded_today"
            )
        )

        xp_amount = (
            habit_result.get(
                "xp_amount_today",
                0,
            )
        )

        if payload.is_confirmed:
            logger.info(
                "\n"
                "==================================================\n"
                "Пользователь подтвердил привычку\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "Дата         : %s\n"
                "XP начислено : %s\n"
                "XP           : %s\n"
                "==================================================",
                user["id"],
                habit_id,
                confirmation_date,
                "Да" if xp_awarded else "Нет",
                xp_amount,
            )

        else:
            logger.info(
                "\n"
                "==================================================\n"
                "Пользователь отменил подтверждение привычки\n\n"
                "Пользователь : %s\n"
                "Привычка     : %s\n"
                "Дата         : %s\n"
                "==================================================",
                user["id"],
                habit_id,
                confirmation_date,
            )

        return result

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    except Exception:
        if payload.is_confirmed:
            error_title = (
                "Ошибка при подтверждении привычки"
            )
        else:
            error_title = (
                "Ошибка при отмене подтверждения привычки"
            )

        logger.exception(
            "\n"
            "==================================================\n"
            "%s\n\n"
            "Пользователь : %s\n"
            "Привычка     : %s\n"
            "==================================================",
            error_title,
            user["id"],
            habit_id,
        )

        raise
