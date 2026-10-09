import { apiRequest } from "../api/apiClient.js";

export async function fetchWeeklyLeaderboard() {
    const data = await apiRequest("/api/leaderboard/week");
    if (!Array.isArray(data?.users) || !data?.current_user || !data?.week) {
        throw new Error("Некорректный ответ недельного рейтинга");
    }
    return data;
}
