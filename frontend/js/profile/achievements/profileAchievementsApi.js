import {
    apiRequest
} from "../../api/apiClient.js"


/* =========================================================
   PROFILE ACHIEVEMENTS API
   ========================================================= */


/* =========================================================
   ПОЛУЧИТЬ ДОСТИЖЕНИЯ
   ========================================================= */

export async function fetchProfileAchievements() {
    const data =
        await apiRequest(
            "/api/profile/achievements"
        )


    // =====================================================
    // ОСНОВНОЙ RESPONSE
    // =====================================================

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        )
    }


    // =====================================================
    // ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ
    // =====================================================

    if (
        !Array.isArray(
            data.earned
        )
    ) {
        throw new Error(
            "Сервер не вернул список достижений"
        )
    }


    // =====================================================
    // ОБЩИЕ ПОКАЗАТЕЛИ
    // =====================================================

    if (
        typeof data.current_streak !== "number" ||
        typeof data.max_streak !== "number" ||
        typeof data.total_confirmations !== "number" ||
        typeof data.total_invitations !== "number" ||
        typeof data.earned_count !== "number" ||
        typeof data.total_count !== "number"
    ) {
        throw new Error(
            "Некорректные данные достижений"
        )
    }


    // =====================================================
    // БЛИЖАЙШИЕ ЦЕЛИ
    // =====================================================

    if (
        !data.next ||
        typeof data.next !== "object"
    ) {
        throw new Error(
            "Некорректные ближайшие цели"
        )
    }


    // =====================================================
    // STREAK
    // =====================================================

    if (
        data.next.streak !== null &&
        typeof data.next.streak !== "object"
    ) {
        throw new Error(
            "Некорректная streak-цель"
        )
    }


    // =====================================================
    // CONFIRMATION
    // =====================================================

    if (
        data.next.confirmation !== null &&
        typeof data.next.confirmation !== "object"
    ) {
        throw new Error(
            "Некорректная confirmation-цель"
        )
    }


    // =====================================================
    // INVITATION
    // =====================================================

    if (
        data.next.invitation !== null &&
        typeof data.next.invitation !== "object"
    ) {
        throw new Error(
            "Некорректная invitation-цель"
        )
    }


    // =====================================================
    // RESPONSE
    // =====================================================

    return data
}