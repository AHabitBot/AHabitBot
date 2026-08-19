import {
    apiRequest,
} from "../../api/apiClient.js";


/* =========================================================
   PROFILE STATS API
   ========================================================= */


const VALID_PERIODS = new Set([
    "week",
    "month",
    "year",
]);


/* =========================================================
   ПОЛУЧИТЬ ИГРОВЫЕ ПОКАЗАТЕЛИ
   ========================================================= */

export async function fetchProfileStats(
    period = "week",
) {
    const normalizedPeriod = String(
        period || "week",
    )
        .trim()
        .toLowerCase();


    // =====================================================
    // ПРОВЕРКА ПЕРИОДА
    // =====================================================

    if (
        !VALID_PERIODS.has(
            normalizedPeriod,
        )
    ) {
        throw new Error(
            "Некорректный период статистики"
        );
    }


    // =====================================================
    // REQUEST
    // =====================================================

    const data =
        await apiRequest(
            `/api/profile/stats?period=${encodeURIComponent(
                normalizedPeriod,
            )}`,
            {
                method: "GET",
            }
        );


    // =====================================================
    // ОСНОВНОЙ RESPONSE
    // =====================================================

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        );
    }


    // =====================================================
    // ПЕРИОД
    // =====================================================

    if (
        !VALID_PERIODS.has(
            data.period,
        )
    ) {
        throw new Error(
            "Сервер вернул некорректный период"
        );
    }


    // =====================================================
    // АКТИВНОСТЬ ПО ДНЯМ НЕДЕЛИ
    // =====================================================

    if (
        !Array.isArray(
            data.weekday_activity,
        ) ||
        data.weekday_activity.length !== 7
    ) {
        throw new Error(
            "Некорректные данные активности"
        );
    }


    // =====================================================
    // ПОДТВЕРЖДЕНИЯ
    // =====================================================

    if (
        !data.confirmations ||
        typeof data.confirmations !== "object" ||
        typeof data.confirmations.value !== "number" ||
        typeof data.confirmations.previous_value !== "number" ||
        !data.confirmations.change ||
        typeof data.confirmations.change !== "object"
    ) {
        throw new Error(
            "Некорректные данные подтверждений"
        );
    }


    // =====================================================
    // XP
    // =====================================================

    if (
        !data.xp ||
        typeof data.xp !== "object" ||
        typeof data.xp.value !== "number" ||
        typeof data.xp.previous_value !== "number" ||
        !data.xp.change ||
        typeof data.xp.change !== "object"
    ) {
        throw new Error(
            "Некорректные данные XP"
        );
    }


    // =====================================================
    // ДИНАМИКА АКТИВНОСТИ
    // =====================================================

    if (
        !data.activity_dynamics ||
        typeof data.activity_dynamics !== "object" ||
        !Array.isArray(
            data.activity_dynamics.points,
        )
    ) {
        throw new Error(
            "Некорректная динамика активности"
        );
    }


    // =====================================================
    // ДОСТИЖЕНИЯ
    // =====================================================

    if (
        !Array.isArray(
            data.achievements,
        )
    ) {
        throw new Error(
            "Некорректные данные достижений"
        );
    }


    // =====================================================
    // RESPONSE
    // =====================================================

    return data;
}