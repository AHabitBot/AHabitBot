import {
    renderSectionIntro
} from "./leaderboardComponents.js"


export function renderLeaderboardSection({
    intro
}) {
    if (!intro) {
        return ""
    }

    return `
        <div class="leaderboard-section">
            ${renderSectionIntro(intro)}
        </div>
    `
}