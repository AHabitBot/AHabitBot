from typing import Any

from backend.database.database import get_connection

from backend.repositories.achievements.achievements_repository import (
    create_user_achievement,
    get_user_achievements,
)

from backend.services.achievements.achievements_config import (
    CONFIRMATION_ACHIEVEMENTS,
    INVITATION_ACHIEVEMENTS,
    STREAK_ACHIEVEMENTS,
)

from backend.services.achievements.achievement_notifications import (
    send_confirmation_achievement_notification,
    send_invitation_achievement_notification,
    send_streak_achievement_notification,
)

from backend.services.leaderboard.season_service import (
    get_season_dates,
    get_season_number,
)


# =========================================================
# ACHIEVEMENTS SERVICE
# =========================================================


# =========================================================
# ПОЛУЧИТЬ СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def _get_user_achievement_state(
    user_id: int,
) -> dict[str, Any] | None:
    """
    Возвращает показатели пользователя,
    необходимые системе достижений.

    Источники:
    - user_stats;
    - referrals.
    """

    async with get_connection() as connection:
        row = await connection.fetchrow(
            """
            SELECT
                u.telegram_id,
                COALESCE(settings.language, 'ru') AS language,

                COALESCE(
                    us.current_streak,
                    0
                ) AS current_streak,

                COALESCE(
                    us.max_streak,
                    0
                ) AS max_streak,

                COALESCE(
                    us.total_confirmations,
                    0
                ) AS total_confirmations,

                COALESCE(
                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM referrals AS r

                        WHERE r.inviter_user_id = u.id
                    ),
                    0
                ) AS total_invitations

            FROM users AS u

            LEFT JOIN user_stats AS us
                ON us.user_id = u.id
            LEFT JOIN user_settings AS settings
                ON settings.user_id = u.id

            WHERE u.id = $1
            """,
            user_id,
        )

    if row is None:
        return None

    return dict(row)


# =========================================================
# СОЗДАТЬ ЗАСЛУЖЕННЫЕ ДОСТИЖЕНИЯ
# =========================================================

async def _create_earned_achievements(
    user_id: int,
    current_value: int,
    achievements_config: list[dict[str, Any]],
    achievement_type: str,
    earned_codes: set[str],
) -> list[dict[str, Any]]:
    """
    Универсальная выдача достижений.

    Проверяет:
    - достигнут ли target;
    - не выдавалось ли достижение раньше.

    После успешного INSERT возвращает
    список новых достижений.
    """

    newly_earned: list[
        dict[str, Any]
    ] = []

    for achievement in achievements_config:

        code = str(
            achievement["code"]
        )

        target = int(
            achievement["target"]
        )

        xp_reward = int(
            achievement["xp_reward"]
        )

        # -------------------------------------------------
        # Порог ещё не достигнут.
        # -------------------------------------------------

        if current_value < target:
            continue

        # -------------------------------------------------
        # Уже получено.
        # -------------------------------------------------

        if code in earned_codes:
            continue

        # -------------------------------------------------
        # Создаём достижение.
        # -------------------------------------------------

        created = await create_user_achievement(
            user_id=user_id,
            achievement_code=code,
            xp_amount=xp_reward,
        )

        # -------------------------------------------------
        # Защита от параллельной выдачи.
        #
        # Repository использует
        # ON CONFLICT DO NOTHING.
        # -------------------------------------------------

        if created is None:
            continue

        newly_earned.append(
            {
                "type":
                    achievement_type,

                "code":
                    code,

                "target":
                    target,

                "xp_reward":
                    xp_reward,

                "image":
                    achievement["image"],

                "earned_at":
                    created["earned_at"],
            }
        )

        earned_codes.add(
            code
        )

    return newly_earned


# =========================================================
# ПОЛУЧИТЬ СЛЕДУЮЩИЙ TARGET
# =========================================================

def _get_next_target(
    achievements_config: list[dict[str, Any]],
    highest_target: int,
) -> int | None:
    for achievement in achievements_config:

        target = int(
            achievement["target"]
        )

        if target > highest_target:
            return target

    return None


# =========================================================
# СИНХРОНИЗИРОВАТЬ ДОСТИЖЕНИЯ ПРИВЫЧЕК
# =========================================================

async def sync_achievements(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Главная синхронизация после изменения
    подтверждения привычки.

    Проверяет только:

    1. streak;
    2. confirmations.

    Invitation здесь намеренно НЕ проверяется.

    Приглашения синхронизируются отдельно
    сразу после успешного create_referral().
    """

    state = await _get_user_achievement_state(
        user_id
    )

    if state is None:
        return []

    telegram_id = int(
        state["telegram_id"]
    )
    language = str(
        state.get("language")
        or "ru"
    )

    max_streak = int(
        state["max_streak"]
        or 0
    )

    total_confirmations = int(
        state["total_confirmations"]
        or 0
    )

    # =====================================================
    # УЖЕ ПОЛУЧЕННЫЕ
    # =====================================================

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_codes = {
        row["achievement_code"]
        for row in earned_rows
    }

    # =====================================================
    # STREAK
    # =====================================================

    new_streak = await _create_earned_achievements(
        user_id=user_id,
        current_value=max_streak,
        achievements_config=
            STREAK_ACHIEVEMENTS,
        achievement_type="streak",
        earned_codes=earned_codes,
    )

    # =====================================================
    # CONFIRMATIONS
    # =====================================================

    new_confirmations = (
        await _create_earned_achievements(
            user_id=user_id,
            current_value=
                total_confirmations,
            achievements_config=
                CONFIRMATION_ACHIEVEMENTS,
            achievement_type=
                "confirmation",
            earned_codes=earned_codes,
        )
    )

    newly_earned = (
        new_streak
        +
        new_confirmations
    )

    # =====================================================
    # НИЧЕГО НОВОГО
    # =====================================================

    if not newly_earned:
        return []

    # =====================================================
    # XP
    # =====================================================

    await recalculate_user_xp(
        user_id
    )

    # =====================================================
    # STREAK NOTIFICATION
    # =====================================================

    if new_streak:

        streak_targets = [
            int(
                item["target"]
            )
            for item
            in new_streak
        ]

        streak_xp = sum(
            int(
                item["xp_reward"]
            )
            for item
            in new_streak
        )

        next_streak_target = (
            _get_next_target(
                STREAK_ACHIEVEMENTS,
                max(
                    streak_targets
                ),
            )
        )

        await send_streak_achievement_notification(
            telegram_id=telegram_id,
            earned_targets=
                streak_targets,
            total_xp_reward=
                streak_xp,
            next_target=
                next_streak_target,
            language=language,
        )

    # =====================================================
    # CONFIRMATION NOTIFICATION
    # =====================================================

    if new_confirmations:

        confirmation_targets = [
            int(
                item["target"]
            )
            for item
            in new_confirmations
        ]

        confirmation_xp = sum(
            int(
                item["xp_reward"]
            )
            for item
            in new_confirmations
        )

        next_confirmation_target = (
            _get_next_target(
                CONFIRMATION_ACHIEVEMENTS,
                max(
                    confirmation_targets
                ),
            )
        )

        await send_confirmation_achievement_notification(
            telegram_id=telegram_id,
            earned_targets=
                confirmation_targets,
            total_xp_reward=
                confirmation_xp,
            next_target=
                next_confirmation_target,
            language=language,
        )

    newly_earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    return newly_earned


# =========================================================
# СИНХРОНИЗИРОВАТЬ ТОЛЬКО STREAK
# =========================================================

async def sync_streak_achievements(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Оставлено для обратной совместимости.
    """

    state = await _get_user_achievement_state(
        user_id
    )

    if state is None:
        return []

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_codes = {
        row["achievement_code"]
        for row in earned_rows
    }

    newly_earned = (
        await _create_earned_achievements(
            user_id=user_id,

            current_value=int(
                state["max_streak"]
                or 0
            ),

            achievements_config=
                STREAK_ACHIEVEMENTS,

            achievement_type=
                "streak",

            earned_codes=
                earned_codes,
        )
    )

    if not newly_earned:
        return []

    await recalculate_user_xp(
        user_id
    )

    targets = [
        int(
            item["target"]
        )
        for item
        in newly_earned
    ]

    total_xp_reward = sum(
        int(
            item["xp_reward"]
        )
        for item
        in newly_earned
    )

    next_target = _get_next_target(
        STREAK_ACHIEVEMENTS,
        max(
            targets
        ),
    )

    await send_streak_achievement_notification(
        telegram_id=int(
            state["telegram_id"]
        ),

        earned_targets=
            targets,

        total_xp_reward=
            total_xp_reward,

        next_target=
            next_target,
        language=str(state.get("language") or "ru"),
    )

    return newly_earned


# =========================================================
# СИНХРОНИЗИРОВАТЬ ТОЛЬКО CONFIRMATIONS
# =========================================================

async def sync_confirmation_achievements(
    user_id: int,
) -> list[dict[str, Any]]:
    state = await _get_user_achievement_state(
        user_id
    )

    if state is None:
        return []

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_codes = {
        row["achievement_code"]
        for row in earned_rows
    }

    newly_earned = (
        await _create_earned_achievements(
            user_id=user_id,

            current_value=int(
                state["total_confirmations"]
                or 0
            ),

            achievements_config=
                CONFIRMATION_ACHIEVEMENTS,

            achievement_type=
                "confirmation",

            earned_codes=
                earned_codes,
        )
    )

    if not newly_earned:
        return []

    await recalculate_user_xp(
        user_id
    )

    targets = [
        int(
            item["target"]
        )
        for item
        in newly_earned
    ]

    total_xp_reward = sum(
        int(
            item["xp_reward"]
        )
        for item
        in newly_earned
    )

    next_target = _get_next_target(
        CONFIRMATION_ACHIEVEMENTS,
        max(
            targets
        ),
    )

    await send_confirmation_achievement_notification(
        telegram_id=int(
            state["telegram_id"]
        ),

        earned_targets=
            targets,

        total_xp_reward=
            total_xp_reward,

        next_target=
            next_target,
        language=str(state.get("language") or "ru"),
    )

    return newly_earned


# =========================================================
# СИНХРОНИЗИРОВАТЬ INVITATION-ДОСТИЖЕНИЯ
# =========================================================

async def sync_invitation_achievements(
    user_id: int,
) -> list[dict[str, Any]]:
    """
    Проверяет достижения за приглашения.

    Вызывается только после того,
    как новый referral действительно создан.

    current_value =
        количество пользователей,
        приглашённых данным пользователем.
    """

    state = await _get_user_achievement_state(
        user_id
    )

    if state is None:
        return []

    total_invitations = int(
        state["total_invitations"]
        or 0
    )

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_codes = {
        row["achievement_code"]
        for row in earned_rows
    }

    newly_earned = (
        await _create_earned_achievements(
            user_id=user_id,

            current_value=
                total_invitations,

            achievements_config=
                INVITATION_ACHIEVEMENTS,

            achievement_type=
                "invitation",

            earned_codes=
                earned_codes,
        )
    )

    if not newly_earned:
        return []

    # =====================================================
    # ПЕРЕСЧИТЫВАЕМ XP
    #
    # Здесь уже учитывается:
    #
    # +5 XP за referral
    # +
    # XP за invitation achievement.
    # =====================================================

    await recalculate_user_xp(
        user_id
    )

    invitation_targets = [
        int(
            item["target"]
        )
        for item
        in newly_earned
    ]

    invitation_xp = sum(
        int(
            item["xp_reward"]
        )
        for item
        in newly_earned
    )

    next_invitation_target = (
        _get_next_target(
            INVITATION_ACHIEVEMENTS,
            max(
                invitation_targets
            ),
        )
    )

    await send_invitation_achievement_notification(
        telegram_id=int(
            state["telegram_id"]
        ),

        earned_targets=
            invitation_targets,

        total_xp_reward=
            invitation_xp,

        next_target=
            next_invitation_target,
        language=str(state.get("language") or "ru"),
    )

    newly_earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    return newly_earned


# =========================================================
# ПЕРЕСЧИТАТЬ XP ПОЛЬЗОВАТЕЛЯ
# =========================================================

async def recalculate_user_xp(
    user_id: int,
) -> None:
    """
    Полностью пересчитывает XP.

    Источники:

    1. подтверждения привычек;
    2. приглашения;
    3. достижения.
    """

    async with get_connection() as connection:
        async with connection.transaction():

            # =================================================
            # ОБЩИЙ XP
            # =================================================

            total_xp = await connection.fetchval(
                """
                SELECT
                    (
                        COALESCE(
                            (
                                SELECT
                                    SUM(hc.xp_amount)

                                FROM habit_confirmations AS hc

                                INNER JOIN habits AS h
                                    ON h.id = hc.habit_id

                                WHERE h.user_id = $1
                                  AND hc.is_confirmed = TRUE
                                  AND hc.xp_awarded = TRUE
                            ),
                            0
                        )

                        +

                        COALESCE(
                            (
                                SELECT
                                    SUM(r.xp_amount)

                                FROM referrals AS r

                                WHERE r.inviter_user_id = $1
                                  AND r.xp_awarded = TRUE
                            ),
                            0
                        )

                        +

                        COALESCE(
                            (
                                SELECT
                                    SUM(ua.xp_amount)

                                FROM user_achievements AS ua

                                WHERE ua.user_id = $1
                                  AND ua.xp_awarded = TRUE
                            ),
                            0
                        )
                    )::INTEGER
                """,
                user_id,
            )

            total_xp = int(
                total_xp
                or 0
            )

            # =================================================
            # USER STATS
            # =================================================

            await connection.execute(
                """
                INSERT INTO user_stats (
                    user_id,
                    total_xp
                )
                VALUES (
                    $1,
                    $2
                )

                ON CONFLICT (user_id)
                DO UPDATE SET
                    total_xp =
                        EXCLUDED.total_xp,

                    updated_at =
                        NOW()
                """,
                user_id,
                total_xp,
            )

            # =================================================
            # ТЕКУЩИЙ СЕЗОН
            # =================================================

            current_date = (
                await connection.fetchval(
                    """
                    SELECT CURRENT_DATE
                    """
                )
            )

            season_number = get_season_number(
                current_date
            )

            season_starts_on, season_ends_on = (
                get_season_dates(
                    season_number
                )
            )

            # =================================================
            # СЕЗОННЫЙ XP
            # =================================================

            season_xp = await connection.fetchval(
                """
                SELECT
                    (
                        COALESCE(
                            (
                                SELECT
                                    SUM(hc.xp_amount)

                                FROM habit_confirmations AS hc

                                INNER JOIN habits AS h
                                    ON h.id = hc.habit_id

                                WHERE h.user_id = $1
                                  AND hc.confirmation_date
                                      BETWEEN $2 AND $3
                                  AND hc.is_confirmed = TRUE
                                  AND hc.xp_awarded = TRUE
                            ),
                            0
                        )

                        +

                        COALESCE(
                            (
                                SELECT
                                    SUM(r.xp_amount)

                                FROM referrals AS r

                                WHERE r.inviter_user_id = $1
                                  AND r.xp_awarded = TRUE
                                  AND r.created_at::DATE
                                      BETWEEN $2 AND $3
                            ),
                            0
                        )

                        +

                        COALESCE(
                            (
                                SELECT
                                    SUM(ua.xp_amount)

                                FROM user_achievements AS ua

                                WHERE ua.user_id = $1
                                  AND ua.xp_awarded = TRUE
                                  AND ua.earned_at::DATE
                                      BETWEEN $2 AND $3
                            ),
                            0
                        )
                    )::INTEGER
                """,
                user_id,
                season_starts_on,
                season_ends_on,
            )

            season_xp = int(
                season_xp
                or 0
            )

            # =================================================
            # USER SEASON STATS
            # =================================================

            await connection.execute(
                """
                INSERT INTO user_season_stats (
                    season_number,
                    user_id,
                    season_xp
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )

                ON CONFLICT (
                    season_number,
                    user_id
                )
                DO UPDATE SET
                    season_xp =
                        EXCLUDED.season_xp,

                    updated_at =
                        NOW()
                """,
                season_number,
                user_id,
                season_xp,
            )


# =========================================================
# ПОЛУЧИТЬ STREAK-ДОСТИЖЕНИЯ
# =========================================================

async def get_streak_achievements(
    user_id: int,
) -> dict[str, Any]:
    state = await _get_user_achievement_state(
        user_id
    )

    if state is None:
        current_streak = 0
        max_streak = 0
    else:
        current_streak = int(
            state["current_streak"]
            or 0
        )

        max_streak = int(
            state["max_streak"]
            or 0
        )

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_by_code = {
        row["achievement_code"]:
            row
        for row in earned_rows
    }

    earned: list[
        dict[str, Any]
    ] = []

    for achievement in STREAK_ACHIEVEMENTS:

        code = str(
            achievement["code"]
        )

        earned_row = earned_by_code.get(
            code
        )

        if earned_row is None:
            continue

        earned.append(
            {
                "type":
                    "streak",

                "code":
                    code,

                "target":
                    int(
                        achievement["target"]
                    ),

                "xp_reward":
                    int(
                        achievement["xp_reward"]
                    ),

                "image":
                    achievement["image"],

                "earned_at":
                    earned_row["earned_at"],
            }
        )

    earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    next_achievement = None

    for achievement in STREAK_ACHIEVEMENTS:

        target = int(
            achievement["target"]
        )

        if target <= max_streak:
            continue

        next_achievement = {
            "type":
                "streak",

            "code":
                achievement["code"],

            "target":
                target,

            "current":
                min(
                    current_streak,
                    target,
                ),

            "xp_reward":
                int(
                    achievement["xp_reward"]
                ),
        }

        break

    return {
        "current_streak":
            current_streak,

        "max_streak":
            max_streak,

        "earned":
            earned,

        "next":
            next_achievement,

        "earned_count":
            len(earned),

        "total_count":
            len(
                STREAK_ACHIEVEMENTS
            ),
    }


# =========================================================
# ПОЛУЧИТЬ CONFIRMATION-ДОСТИЖЕНИЯ
# =========================================================

async def get_confirmation_achievements(
    user_id: int,
) -> dict[str, Any]:
    state = await _get_user_achievement_state(
        user_id
    )

    total_confirmations = int(
        state["total_confirmations"]
        if state
        else 0
    )

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_by_code = {
        row["achievement_code"]:
            row
        for row in earned_rows
    }

    earned: list[
        dict[str, Any]
    ] = []

    for achievement in CONFIRMATION_ACHIEVEMENTS:

        code = str(
            achievement["code"]
        )

        earned_row = earned_by_code.get(
            code
        )

        if earned_row is None:
            continue

        earned.append(
            {
                "type":
                    "confirmation",

                "code":
                    code,

                "target":
                    int(
                        achievement["target"]
                    ),

                "xp_reward":
                    int(
                        achievement["xp_reward"]
                    ),

                "image":
                    achievement["image"],

                "earned_at":
                    earned_row["earned_at"],
            }
        )

    earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    earned_codes = {
        item["code"]
        for item in earned
    }

    next_achievement = None

    for achievement in CONFIRMATION_ACHIEVEMENTS:

        code = str(
            achievement["code"]
        )

        if code in earned_codes:
            continue

        target = int(
            achievement["target"]
        )

        next_achievement = {
            "type":
                "confirmation",

            "code":
                code,

            "target":
                target,

            "current":
                min(
                    total_confirmations,
                    target,
                ),

            "xp_reward":
                int(
                    achievement["xp_reward"]
                ),
        }

        break

    return {
        "total_confirmations":
            total_confirmations,

        "earned":
            earned,

        "next":
            next_achievement,

        "earned_count":
            len(earned),

        "total_count":
            len(
                CONFIRMATION_ACHIEVEMENTS
            ),
    }


# =========================================================
# ПОЛУЧИТЬ INVITATION-ДОСТИЖЕНИЯ
# =========================================================

async def get_invitation_achievements(
    user_id: int,
) -> dict[str, Any]:
    """
    Возвращает прогресс приглашений
    и ближайшее invitation-достижение.
    """

    state = await _get_user_achievement_state(
        user_id
    )

    total_invitations = int(
        state["total_invitations"]
        if state
        else 0
    )

    earned_rows = await get_user_achievements(
        user_id
    )

    earned_by_code = {
        row["achievement_code"]:
            row
        for row in earned_rows
    }

    earned: list[
        dict[str, Any]
    ] = []

    for achievement in INVITATION_ACHIEVEMENTS:

        code = str(
            achievement["code"]
        )

        earned_row = earned_by_code.get(
            code
        )

        if earned_row is None:
            continue

        earned.append(
            {
                "type":
                    "invitation",

                "code":
                    code,

                "target":
                    int(
                        achievement["target"]
                    ),

                "xp_reward":
                    int(
                        achievement["xp_reward"]
                    ),

                "image":
                    achievement["image"],

                "earned_at":
                    earned_row["earned_at"],
            }
        )

    earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    earned_codes = {
        item["code"]
        for item
        in earned
    }

    next_achievement = None

    for achievement in INVITATION_ACHIEVEMENTS:

        code = str(
            achievement["code"]
        )

        if code in earned_codes:
            continue

        target = int(
            achievement["target"]
        )

        next_achievement = {
            "type":
                "invitation",

            "code":
                code,

            "target":
                target,

            "current":
                min(
                    total_invitations,
                    target,
                ),

            "xp_reward":
                int(
                    achievement["xp_reward"]
                ),
        }

        break

    return {
        "total_invitations":
            total_invitations,

        "earned":
            earned,

        "next":
            next_achievement,

        "earned_count":
            len(earned),

        "total_count":
            len(
                INVITATION_ACHIEVEMENTS
            ),
    }


# =========================================================
# ПОЛУЧИТЬ ВСЕ ДОСТИЖЕНИЯ
# =========================================================

async def get_achievements(
    user_id: int,
) -> dict[str, Any]:
    """
    Возвращает единые данные страницы достижений:

    - streak;
    - confirmation;
    - invitation.
    """

    streak = await get_streak_achievements(
        user_id
    )

    confirmations = (
        await get_confirmation_achievements(
            user_id
        )
    )

    invitations = (
        await get_invitation_achievements(
            user_id
        )
    )

    # =====================================================
    # ВСЕ ПОЛУЧЕННЫЕ
    # =====================================================

    earned = (
        streak["earned"]
        +
        confirmations["earned"]
        +
        invitations["earned"]
    )

    # =====================================================
    # ПОСЛЕДНИЕ — ПЕРВЫМИ
    # =====================================================

    earned.sort(
        key=lambda item:
            item["earned_at"],
        reverse=True,
    )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "earned":
            earned,

        "next": {
            "streak":
                streak["next"],

            "confirmation":
                confirmations["next"],

            "invitation":
                invitations["next"],
        },

        "current_streak":
            streak[
                "current_streak"
            ],

        "max_streak":
            streak[
                "max_streak"
            ],

        "total_confirmations":
            confirmations[
                "total_confirmations"
            ],

        "total_invitations":
            invitations[
                "total_invitations"
            ],

        "earned_count":
            len(
                earned
            ),

        "total_count":
            (
                len(
                    STREAK_ACHIEVEMENTS
                )
                +
                len(
                    CONFIRMATION_ACHIEVEMENTS
                )
                +
                len(
                    INVITATION_ACHIEVEMENTS
                )
            ),
    }