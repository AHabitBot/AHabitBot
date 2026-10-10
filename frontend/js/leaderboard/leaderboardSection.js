import { renderLeaderboardList } from "./leaderboardComponents.js";

export function renderLeaderboardSection({ users = [], currentUserId = null }) {
    return `<div class="leaderboard-section">${renderLeaderboardList(users, currentUserId)}</div>`;
}
