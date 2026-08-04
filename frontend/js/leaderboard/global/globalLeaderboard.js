import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


export function renderGlobalLeaderboard() {

    return renderLeaderboardSection({

        intro: {
            title: "Глобальный рейтинг",
            subtitle:
                "Соревнуйтесь с лучшими привычками мира",
            backgroundImage:
                "/img/leaderboard/global-section-intro.jpg"
        },

        topUsers: [

            {
                rank: 2,
                name: "Мария",
                xp: "39 600",
                avatar: "/img/profile/avatar beginer.png"
            },

            {
                rank: 1,
                name: "Александр",
                xp: "50 230",
                avatar: "/img/profile/avatar beginer.png"
            },

            {
                rank: 3,
                name: "Игорь",
                xp: "38 640",
                avatar: "/img/profile/avatar beginer.png"
            }

        ]

    });

}