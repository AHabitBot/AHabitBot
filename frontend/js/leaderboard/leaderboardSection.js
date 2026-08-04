import {
    renderSectionIntro,
    renderTopThree,
    renderLeaderboardList
} from "./leaderboardComponents.js";


export function renderLeaderboardSection({
    intro,
    topUsers = [],
    users = []
}) {
    return `
        <div class="leaderboard-section">
            ${renderSectionIntro(intro)}
            ${renderTopThree(topUsers)}
            ${renderLeaderboardList(users)}
        </div>
    `;
}