import {
    renderSectionIntro,
    renderTopThree,
    renderLeaderboardList,
    renderCurrentUserCard
} from "./leaderboardComponents.js"


export function renderLeaderboardSection({
    intro,
    topUsers = [],
    users = [],
    currentUser = null
}) {
    return `
        <div class="leaderboard-section">
            ${renderSectionIntro(intro)}

            ${renderTopThree(topUsers)}

            ${renderLeaderboardList(users)}

            ${
                currentUser
                    ? renderCurrentUserCard(currentUser)
                    : ""
            }
        </div>
    `
}