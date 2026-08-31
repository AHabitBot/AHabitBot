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

/* =========================================================
   SEASON LEADERBOARD
   ========================================================= */

export async function fetchSeasonLeaderboard() {
    const data =
        await apiRequest(
            "/api/leaderboard/season"
        );

    const isFinished =
        data?.season?.status === "finished";

    if (
        !isFinished
        && !Array.isArray(data?.users)
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        );
    }

    if (!isFinished && !data.current_user) {
        throw new Error(
            "Не получен текущий пользователь"
        );
    }

    return data;
}