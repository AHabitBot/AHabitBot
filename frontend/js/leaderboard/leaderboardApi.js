import {
    apiRequest
} from "../api/apiClient.js";


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