const leaderboardState = {
    selectedTab: "global",

    currentUserId: 14,

    globalLeaderboard: [
        {
            id: 1,
            name: "Александр",
            avatar: "./img/leaderboard/alexander.jpg",
            xp: 50230
        },
        {
            id: 2,
            name: "Мария",
            avatar: "./img/leaderboard/maria.jpg",
            xp: 43870
        },
        {
            id: 3,
            name: "Игорь",
            avatar: "./img/leaderboard/igor.jpg",
            xp: 38640
        },
        {
            id: 4,
            name: "Ольга",
            avatar: "./img/leaderboard/olga.jpg",
            xp: 31750
        },
        {
            id: 5,
            name: "Никита",
            avatar: "./img/leaderboard/nikita.jpg",
            xp: 29410
        },
        {
            id: 6,
            name: "Екатерина",
            avatar: "./img/leaderboard/ekaterina.jpg",
            xp: 27180
        },
        {
            id: 7,
            name: "Дмитрий",
            avatar: "./img/leaderboard/dmitriy.jpg",
            xp: 25830
        },
        {
            id: 8,
            name: "Андрей",
            avatar: "./img/leaderboard/andrey.jpg",
            xp: 24200
        },
        {
            id: 9,
            name: "Владислав",
            avatar: "./img/leaderboard/vladislav.jpg",
            xp: 22140
        },
        {
            id: 10,
            name: "Полина",
            avatar: "./img/leaderboard/polina.jpg",
            xp: 20730
        },
        {
            id: 11,
            name: "Максим",
            avatar: "./img/leaderboard/maxim.jpg",
            xp: 18960
        },
        {
            id: 12,
            name: "Алина",
            avatar: "./img/leaderboard/alina.jpg",
            xp: 17420
        },
        {
            id: 13,
            name: "Роман",
            avatar: "./img/leaderboard/roman.jpg",
            xp: 15870
        },
        {
            id: 14,
            name: "Вы",
            avatar: "./img/leaderboard/current-user.jpg",
            xp: 14320
        },
        {
            id: 15,
            name: "София",
            avatar: "./img/leaderboard/sofia.jpg",
            xp: 13280
        },
        {
            id: 16,
            name: "Артём",
            avatar: "./img/leaderboard/artem.jpg",
            xp: 12140
        },
        {
            id: 17,
            name: "Виктория",
            avatar: "./img/leaderboard/victoria.jpg",
            xp: 11090
        },
        {
            id: 18,
            name: "Сергей",
            avatar: "./img/leaderboard/sergey.jpg",
            xp: 9860
        },
        {
            id: 19,
            name: "Анна",
            avatar: "./img/leaderboard/anna.jpg",
            xp: 8720
        },
        {
            id: 20,
            name: "Денис",
            avatar: "./img/leaderboard/denis.jpg",
            xp: 7610
        },
        {
            id: 21,
            name: "Дарья",
            avatar: "./img/leaderboard/darya.jpg",
            xp: 6480
        },
        {
            id: 22,
            name: "Кирилл",
            avatar: "./img/leaderboard/kirill.jpg",
            xp: 5370
        },
        {
            id: 23,
            name: "Вероника",
            avatar: "./img/leaderboard/veronika.jpg",
            xp: 4260
        },
        {
            id: 24,
            name: "Михаил",
            avatar: "./img/leaderboard/mikhail.jpg",
            xp: 3150
        },
        {
            id: 25,
            name: "Юлия",
            avatar: "./img/leaderboard/yulia.jpg",
            xp: 2040
        }
    ],

    seasonLeaderboard: []
}


export function getLeaderboardState() {
    return leaderboardState
}


export function getSelectedLeaderboardTab() {
    return leaderboardState.selectedTab
}


export function setSelectedLeaderboardTab(tab) {
    const allowedTabs = [
        "global",
        "season"
    ]

    if (!allowedTabs.includes(tab)) {
        console.warn(
            `Leaderboard: неизвестная вкладка "${tab}"`
        )

        return
    }

    leaderboardState.selectedTab = tab
}


export function getGlobalLeaderboard() {
    return leaderboardState.globalLeaderboard
}


export function getSeasonLeaderboard() {
    return leaderboardState.seasonLeaderboard
}


export function getCurrentLeaderboard() {
    if (
        leaderboardState.selectedTab ===
        "season"
    ) {
        return leaderboardState
            .seasonLeaderboard
    }

    return leaderboardState
        .globalLeaderboard
}


export function getSortedLeaderboard(
    leaderboard = getCurrentLeaderboard()
) {
    return [...leaderboard]
        .sort(
            (firstUser, secondUser) =>
                secondUser.xp -
                firstUser.xp
        )
        .map(
            (user, index) => ({
                ...user,
                position: index + 1
            })
        )
}


export function getTopLeaderboardUsers(
    limit = 3
) {
    return getSortedLeaderboard()
        .slice(0, limit)
}


export function getLeaderboardUsersAfterTop(
    limit = 97
) {
    return getSortedLeaderboard()
        .slice(3, 3 + limit)
}


export function getCurrentLeaderboardUser() {
    return getSortedLeaderboard()
        .find(
            user =>
                user.id ===
                leaderboardState.currentUserId
        ) || null
}


export function formatLeaderboardXp(xp) {
    const safeXp =
        Number.isFinite(Number(xp))
            ? Number(xp)
            : 0

    return new Intl.NumberFormat(
        "ru-RU"
    ).format(safeXp)
}