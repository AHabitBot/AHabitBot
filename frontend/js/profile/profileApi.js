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


/* =========================================================
   ИЗМЕНИТЬ NICKNAME
   ========================================================= */

export async function updateProfileNickname(
    nickname
) {
    const normalizedNickname =
        String(
            nickname || ""
        ).trim()


    if (!normalizedNickname) {
        throw new Error(
            "Не передан новый никнейм"
        )
    }


    const data =
        await apiRequest(
            "/api/profile/nickname",
            {
                method: "PATCH",

                body: {
                    nickname:
                        normalizedNickname
                }
            }
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
        typeof data.nickname !== "string" ||
        data.nickname_can_change !== false
    ) {
        throw new Error(
            "Сервер не вернул обновлённый профиль"
        )
    }


    return data
}