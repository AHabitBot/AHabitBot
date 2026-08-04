import {
    renderSectionIntro,
    renderTopThree
} from "./leaderboardComponents.js";


export function renderLeaderboardSection({
    intro,
    topUsers = []
}) {

    return `
        <div class="leaderboard-section">

            ${renderSectionIntro(intro)}

            ${renderTopThree(topUsers)}

        </div>
    `;

}