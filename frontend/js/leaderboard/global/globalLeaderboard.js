import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


const AVATARM =
    "/img/profile/avatar/beginer_m.png";

const AVATARF =
    "/img/profile/avatar/beginer_f.png";


export const globalCurrentUser = {
    rank: 14,
    name: "Вы",
    xp: "2 180",
    streak: 7,
    avatar: AVATAR
};


export function renderGlobalLeaderboard() {
    return renderLeaderboardSection({
        topUsers: [
            {
                rank: 2,
                name: "Shadow",
                xp: "9 430",
                streak: 21,
                avatar: AVATARM
            },
            {
                rank: 1,
                name: "Maximus",
                xp: "12 560",
                streak: 28,
                avatar: AVATARM
            },
            {
                rank: 3,
                name: "Panda",
                xp: "8 210",
                streak: 18,
                avatar: AVATARF
            }
        ],

        users: [
            {
                rank: 4,
                name: "Wolf",
                xp: "7 450",
                streak: 16,
                avatar: AVATARF
            },
            {
                rank: 5,
                name: "Robo",
                xp: "6 870",
                streak: 15,
                avatar: AVATARF
            },
            {
                rank: 6,
                name: "Fox",
                xp: "6 120",
                streak: 14,
                avatar: AVATARM
            },
            {
                rank: 7,
                name: "Penguin",
                xp: "5 340",
                streak: 12,
                avatar: AVATARF
            },
            {
                rank: 8,
                name: "Leo",
                xp: "4 980",
                streak: 11,
                avatar: AVATARM
            },
            {
                rank: 9,
                name: "Storm",
                xp: "4 650",
                streak: 10,
                avatar: AVATARM
            },
            {
                rank: 10,
                name: "Hunter",
                xp: "4 320",
                streak: 9,
                avatar: AVATARM
            },
            {
                rank: 11,
                name: "Rocky",
                xp: "3 970",
                streak: 9,
                avatar: AVATARM
            },
            {
                rank: 12,
                name: "Flash",
                xp: "3 640",
                streak: 8,
                avatar: AVATARF
            },
            {
                rank: 13,
                name: "Blade",
                xp: "3 210",
                streak: 8,
                avatar: AVATARF
            },
            {
                rank: 14,
                name: "Fhntv",
                xp: "2 180",
                streak: 7,
                avatar: AVATARF
            },
            {
                rank: 15,
                name: "Phoenix",
                xp: "2 030",
                streak: 7,
                avatar: AVATARM
            },
            {
                rank: 16,
                name: "Tiger",
                xp: "1 890",
                streak: 6,
                avatar: AVATARF
            },
            {
                rank: 17,
                name: "Ace",
                xp: "1 760",
                streak: 6,
                avatar: AVATARF
            },
            {
                rank: 18,
                name: "Atlas",
                xp: "1 540",
                streak: 5,
                avatar: AVATARF
            },
            {
                rank: 19,
                name: "Ghost",
                xp: "1 320",
                streak: 5,
                avatar: AVATARF
            },
            {
                rank: 20,
                name: "Falcon",
                xp: "1 180",
                streak: 4,
                avatar: AVATARF
            }
        ]
    });
}