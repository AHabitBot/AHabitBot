import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


const AVATAR =
    "/img/profile/avatar/beginer.png";


export const globalCurrentUser = {
    rank: 14,
    name: "Вы",
    xp: "12 680",
    avatar: AVATAR
};


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
                medal: "🥈",
                name: "Владимир",
                xp: "43 870",
                avatar: AVATAR
            },
            {
                rank: 1,
                medal: "🥇",
                name: "Александр",
                xp: "50 230",
                avatar: AVATAR
            },
            {
                rank: 3,
                medal: "🥉",
                name: "Игорь",
                xp: "38 640",
                avatar: AVATAR
            }
        ],

        users: [
            { rank: 4, name: "Дмитрий", xp: "32 210", avatar: AVATAR },
            { rank: 5, name: "Максим", xp: "28 450", avatar: AVATAR },
            { rank: 6, name: "Анна", xp: "24 780", avatar: AVATAR },
            { rank: 7, name: "Екатерина", xp: "22 190", avatar: AVATAR },
            { rank: 8, name: "Сергей", xp: "18 450", avatar: AVATAR },
            { rank: 9, name: "Мария", xp: "16 320", avatar: AVATAR },
            { rank: 10, name: "Артём", xp: "14 050", avatar: AVATAR },
            { rank: 11, name: "Никита", xp: "13 760", avatar: AVATAR },
            { rank: 12, name: "Ольга", xp: "13 420", avatar: AVATAR },
            { rank: 13, name: "Кирилл", xp: "13 010", avatar: AVATAR },
            { rank: 14, name: "Fhntv", xp: "12 680", avatar: AVATAR },
            { rank: 15, name: "Алина", xp: "12 310", avatar: AVATAR },
            { rank: 16, name: "Виктор", xp: "11 980", avatar: AVATAR },
            { rank: 17, name: "Дарья", xp: "11 540", avatar: AVATAR },
            { rank: 18, name: "Роман", xp: "10 920", avatar: AVATAR },
            { rank: 19, name: "Елена", xp: "10 410", avatar: AVATAR },
            { rank: 20, name: "Олег", xp: "9 870", avatar: AVATAR }
        ]
    });
}