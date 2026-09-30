import { apiRequest } from "../api/apiClient.js";

export async function fetchPublicProfile(userId) {
    const data = await apiRequest(
        `/api/profile/public/${encodeURIComponent(userId)}`,
        { method: "GET" }
    );
    if (!data || typeof data !== "object") {
        throw new Error("Некорректный публичный профиль");
    }
    return data;
}
