import { renderLeaderboardList } from "./leaderboardComponents.js";

export function renderLeaderboardSection({ users = [], currentUserId = null, zones = null }) {
    return `<div class="leaderboard-section">${renderLeaderboardList(users, currentUserId, zones)}</div>`;
}
