import {
    renderLeaderboardSection
} from "../leaderboardSection.js"


export function renderSeasonLeaderboard() {
    return renderLeaderboardSection({
        intro: {
            title: "Сезонный рейтинг",
            subtitle:
                "Станьте лучшим участником текущего сезона",
            backgroundImage:
                "./img/leaderboard/season-section-intro.jpg"
        },

        topUsers: [],

        users: [],

        currentUser: null
    })
}