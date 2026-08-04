import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


export function renderGlobalLeaderboard() {

    return renderLeaderboardSection({

        intro: {
            title: "Глобальный рейтинг",
            subtitle: "Соревнуйтесь с лучшими привычками мира",
            backgroundImage: "/img/leaderboard/global-section-intro.jpg"
        },

        topUsers: [

            {
                rank: 2,
                medal: "🥈",
                name: "Владимир",
                xp: "43 870",
                avatar: "/img/profile/avatar/beginer.png"
            },

            {
                rank: 1,
                medal: "🥇",
                name: "Александр",
                xp: "50 230",
                avatar: "/img/profile/avatar/beginer.png"
            },

            {
                rank: 3,
                medal: "🥉",
                name: "Игорь",
                xp: "38 640",
                avatar: "/img/profile/avatar/beginer.png"
            }

        ]

    });

}