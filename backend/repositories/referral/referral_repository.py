import asyncpg

from backend.database.database import get_connection
from backend.services.leaderboard.season_service import (
    get_season_context,
)


# ============================================================================
# Создание реферальной связи
# ============================================================================

async def create_referral(
    inviter_user_id: int,
    invited_user_id: int,
    xp_amount: int = 5,
) -> asyncpg.Record | None:
    """
    Создаёт реферальную связь и начисляет XP пригласившему.

    XP начисляется:
    - в общий user_stats.total_xp;
    - в user_season_stats текущего сезона.

    Один invited_user_id может существовать
    в таблице referrals только один раз.
    """

    # ------------------------------------------------------------------------
    # Защита от самоприглашения.
    # ------------------------------------------------------------------------

    if inviter_user_id == invited_user_id:
        return None

    # ------------------------------------------------------------------------
    # Определяем текущий сезон по дате Europe/Kyiv.
    # ------------------------------------------------------------------------

    season_context = get_season_context()
    season_number = season_context.number

    async with get_connection() as connection:
        async with connection.transaction():

            # ----------------------------------------------------------------
            # Создаём реферальную связь.
            #
            # UNIQUE(invited_user_id) + ON CONFLICT DO NOTHING
            # гарантируют, что за одного приглашённого
            # XP нельзя начислить повторно.
            # ----------------------------------------------------------------

            referral = await connection.fetchrow(
                """
                INSERT INTO referrals (
                    inviter_user_id,
                    invited_user_id,
                    xp_awarded,
                    xp_amount
                )
                VALUES (
                    $1,
                    $2,
                    TRUE,
                    $3
                )

                ON CONFLICT (invited_user_id)
                DO NOTHING

                RETURNING
                    id,
                    inviter_user_id,
                    invited_user_id,
                    xp_awarded,
                    xp_amount,
                    created_at
                """,
                inviter_user_id,
                invited_user_id,
                xp_amount,
            )

            if referral is None:
                return None

            # ----------------------------------------------------------------
            # Начисляем XP в общую статистику пользователя.
            # ----------------------------------------------------------------

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
                        user_stats.total_xp
                        + EXCLUDED.total_xp,

                    updated_at = NOW()
                """,
                inviter_user_id,
                xp_amount,
            )

            # ----------------------------------------------------------------
            # Season XP начисляется только в активную часть сезона.
            # В итоговую неделю global XP продолжает начисляться выше.
            # ----------------------------------------------------------------

            if season_context.xp_active:
                await connection.execute(
                    """
                    INSERT INTO user_season_stats (season_number, user_id, season_xp)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (season_number, user_id)
                    DO UPDATE SET
                        season_xp = user_season_stats.season_xp + EXCLUDED.season_xp,
                        updated_at = NOW()
                    """,
                    season_number, inviter_user_id, xp_amount,
                )

            return referral


# ============================================================================
# Проверка существования приглашения
# ============================================================================

async def get_referral_by_invited_user_id(
    invited_user_id: int,
) -> asyncpg.Record | None:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            SELECT
                id,
                inviter_user_id,
                invited_user_id,
                xp_awarded,
                xp_amount,
                created_at
            FROM referrals
            WHERE invited_user_id = $1
            """,
            invited_user_id,
        )


# ============================================================================
# Статистика приглашений
# ============================================================================

async def get_referral_stats(
    inviter_user_id: int,
) -> asyncpg.Record:
    async with get_connection() as connection:
        return await connection.fetchrow(
            """
            SELECT
                COUNT(*)::INTEGER AS invited_count,

                COALESCE(
                    SUM(
                        CASE
                            WHEN xp_awarded = TRUE
                            THEN xp_amount
                            ELSE 0
                        END
                    ),
                    0
                )::INTEGER AS earned_xp

            FROM referrals
            WHERE inviter_user_id = $1
            """,
            inviter_user_id,
        )