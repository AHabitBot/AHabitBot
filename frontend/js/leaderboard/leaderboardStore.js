export const LEADERBOARD_ALLOWED_USER_IDS = new Set([
    900410719,
]);


/* =========================================================
   ACCESS
   ========================================================= */

export function getTelegramUserId() {
    const telegramId =
        window.Telegram?.WebApp
            ?.initDataUnsafe
            ?.user
            ?.id;

    return Number.isInteger(telegramId)
        ? telegramId
        : null;
}


export function canAccessLeaderboard() {
    const telegramId =
        getTelegramUserId();

    return (
        telegramId !== null
        && LEADERBOARD_ALLOWED_USER_IDS
            .has(telegramId)
    );
}


/* =========================================================
   STATE
   ========================================================= */

const leaderboardState = {
    activeTab: "global",

    global: {
        data: null,
        isLoaded: false,
    },

    season: {
        data: null,
        isLoaded: false,
    },
};

/* =========================================================
   ACTIVE TAB
   ========================================================= */

export function getActiveLeaderboardTab() {
    return leaderboardState.activeTab;
}


export function setActiveLeaderboardTab(
    tab
) {
    if (
        !["global", "season"].includes(
            tab
        )
    ) {
        return;
    }

    leaderboardState.activeTab = tab;
}


/* =========================================================
   GLOBAL CACHE
   ========================================================= */

export function getGlobalLeaderboardData() {
    return leaderboardState.global.data;
}


export function hasGlobalLeaderboardData() {
    return (
        leaderboardState.global.isLoaded
        && leaderboardState.global.data
            !== null
    );
}


export function setGlobalLeaderboardData(
    data
) {
    leaderboardState.global.data = data;
    leaderboardState.global.isLoaded = true;
}


export function clearGlobalLeaderboardData() {
    leaderboardState.global.data = null;
    leaderboardState.global.isLoaded = false;
}


/* =========================================================
   SEASON CACHE
   ========================================================= */
export function getSeasonLeaderboardData() {
    return leaderboardState.season.data;
}

export function hasSeasonLeaderboardData() {
    return (
        leaderboardState.season.isLoaded
        && leaderboardState.season.data !== null
    );
}

export function setSeasonLeaderboardData(data) {
    leaderboardState.season.data = data;
    leaderboardState.season.isLoaded = true;
}

export function clearSeasonLeaderboardData() {
    leaderboardState.season.data = null;
    leaderboardState.season.isLoaded = false;
}