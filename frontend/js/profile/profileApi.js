import {
    apiRequest
} from "../api/apiClient.js"


/* =========================================================
   PROFILE API
   ========================================================= */


/* =========================================================
   ПОЛУЧИТЬ ПРОФИЛЬ
   ========================================================= */

export async function fetchProfile() {
    const data =
        await apiRequest(
            "/api/profile"
        )


    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        )
    }


    if (
        typeof data.level !== "number" ||
        typeof data.level_xp !== "number" ||
        typeof data.level_xp_required !== "number" ||
        typeof data.level_progress !== "number"
    ) {
        throw new Error(
            "Некорректные данные профиля"
        )
    }


    return data
}