import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


const AVATARM =
    "/img/profile/avatar/beginer_m.png";

const AVATARF =
    "/img/profile/avatar/beginer_f.png";


/* =========================================================
   CURRENT USER — SEASON
   ========================================================= */

export const seasonCurrentUser = {
    rank: 9,
    name: "Вы",
    xp: "860",
    streak: 7,
    avatar: AVATARM
};


/* =========================================================
   SEASON LEADERBOARD
   ========================================================= */

export function renderSeasonLeaderboard() {
    return renderLeaderboardSection({
        topUsers: [
            {
                rank: 2,
                name: "Storm",
                xp: "3 240",
                streak: 18,
                avatar: AVATARF
            },
            {
                rank: 1,
                name: "Phoenix",
                xp: "3 860",
                streak: 23,
                avatar: AVATARM
            },
            {
                rank: 3,
                name: "Hunter",
                xp: "2 940",
                streak: 16,
                avatar: AVATARM
            }
        ],

        users: [
            {
                rank: 4,
                name: "Flash",
                xp: "2 610",
                streak: 15,
                avatar: AVATARF
            },
            {
                rank: 5,
                name: "Atlas",
                xp: "2 340",
                streak: 14,
                avatar: AVATARM
            },
            {
                rank: 6,
                name: "Tiger",
                xp: "1 980",
                streak: 12,
                avatar: AVATARF
            },
            {
                rank: 7,
                name: "Falcon",
                xp: "1 620",
                streak: 10,
                avatar: AVATARM
            },
            {
                rank: 8,
                name: "Blade",
                xp: "1 240",
                streak: 8,
                avatar: AVATARF
            },
            {
                rank: 9,
                name: "Fhntv",
                xp: "860",
                streak: 7,
                avatar: AVATARF
            },
            {
                rank: 10,
                name: "Ace",
                xp: "790",
                streak: 7,
                avatar: AVATARM
            },
            {
                rank: 11,
                name: "Ghost",
                xp: "710",
                streak: 6,
                avatar: AVATARF
            },
            {
                rank: 12,
                name: "Rocky",
                xp: "640",
                streak: 6,
                avatar: AVATARM
            },
            {
                rank: 13,
                name: "Leo",
                xp: "570",
                streak: 5,
                avatar: AVATARM
            },
            {
                rank: 14,
                name: "Robo",
                xp: "510",
                streak: 5,
                avatar: AVATARF
            },
            {
                rank: 15,
                name: "Penguin",
                xp: "460",
                streak: 4,
                avatar: AVATARF
            },
            {
                rank: 16,
                name: "Shadow",
                xp: "390",
                streak: 4,
                avatar: AVATARM
            },
            {
                rank: 17,
                name: "Panda",
                xp: "330",
                streak: 3,
                avatar: AVATARF
            },
            {
                rank: 18,
                name: "Wolf",
                xp: "280",
                streak: 3,
                avatar: AVATARM
            },
            {
                rank: 19,
                name: "Fox",
                xp: "210",
                streak: 2,
                avatar: AVATARM
            },
            {
                rank: 20,
                name: "Max",
                xp: "150",
                streak: 1,
                avatar: AVATARM
            }
        ]
    });
}