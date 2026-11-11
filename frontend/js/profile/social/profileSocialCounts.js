import { apiRequest } from "../../api/apiClient.js";

// Запрашиваем реальные счётчики; ноль отображается только после успешного ответа.
export async function loadSocialCounts(root, userId = null) {
    const counts = root?.querySelectorAll(".profile-user-card__social-count strong");
    if (!counts || counts.length !== 2) return;
    const path = userId == null ? "/api/follows/me" : `/api/follows/users/${encodeURIComponent(userId)}`;
    try {
        const data = await apiRequest(path);
        if (!root.isConnected) return;
        counts[0].textContent = String(Math.max(0, Number(data.following_count) || 0));
        counts[1].textContent = String(Math.max(0, Number(data.followers_count) || 0));
    } catch (error) {
        console.error("Social counts:", error);
        if (!root.isConnected) return;
        counts.forEach(count => { count.textContent = "—"; });
    }
}
