import {
    initLeaderboardEvents
} from "./leaderboardEvents.js"


export function initLeaderboard() {
    const leaderboardRoot =
        document.getElementById(
            "leaderboard-root"
        )

    if (!leaderboardRoot) {
        console.error(
            "Leaderboard: не найден контейнер #leaderboard-root"
        )

        return
    }

    initLeaderboardEvents()
}