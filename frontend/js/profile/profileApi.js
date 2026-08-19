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


/* =========================================================
   ИЗМЕНИТЬ ВНЕШНИЙ ВИД
   ========================================================= */

export async function updateProfileAppearance({
    avatarKey,
    backgroundKey
}) {
    const normalizedAvatarKey =
        String(
            avatarKey || ""
        ).trim()

    const normalizedBackgroundKey =
        String(
            backgroundKey || ""
        ).trim()


    if (!normalizedAvatarKey) {
        throw new Error(
            "Не передан avatarKey"
        )
    }


    if (!normalizedBackgroundKey) {
        throw new Error(
            "Не передан backgroundKey"
        )
    }


    const data =
        await apiRequest(
            "/api/profile/appearance",
            {
                method: "PATCH",

                body: {
                    avatar_key:
                        normalizedAvatarKey,

                    background_key:
                        normalizedBackgroundKey
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
        typeof data.avatar_key !== "string" ||
        typeof data.background_key !== "string"
    ) {
        throw new Error(
            "Сервер не вернул обновлённый внешний вид"
        )
    }


    return data
}