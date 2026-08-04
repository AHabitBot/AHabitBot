import {
    renderTopThree,
    renderLeaderboardList
} from "./leaderboardComponents.js";


export function renderLeaderboardSection({
    topUsers = [],
    users = []
}) {
    return `
        <div class="leaderboard-section">
            ${renderTopThree(topUsers)}
            ${renderLeaderboardList(users)}
        </div>
    `;
}