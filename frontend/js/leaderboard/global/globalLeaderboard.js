import {
    renderLeaderboardSection
} from "../leaderboardSection.js"


export function renderGlobalLeaderboard() {
    return renderLeaderboardSection({
        intro: {
            title: "Глобальный рейтинг",
            subtitle:
                "Соревнуйтесь с лучшими привычками мира",
            backgroundImage:
                "/img/leaderboard/global-section-intro.jpg"
        }
    })
}