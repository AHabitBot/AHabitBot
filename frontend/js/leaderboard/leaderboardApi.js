import {
    apiRequest
} from "../api/apiClient.js";


/* =========================================================
   GLOBAL LEADERBOARD
   ========================================================= */

export async function fetchGlobalLeaderboard() {
    const data =
        await apiRequest(
            "/api/leaderboard/global"
        );

    if (
        !Array.isArray(
            data?.users
        )
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        );
    }

    if (!data.current_user) {
        throw new Error(
            "Не получен текущий пользователь"
        );
    }

    return data;
}