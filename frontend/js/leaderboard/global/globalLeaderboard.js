import {
    fetchGlobalLeaderboard
} from "../leaderboardApi.js";

import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


import {
    getGlobalLeaderboardData,
    hasGlobalLeaderboardData,
    setGlobalLeaderboardData
} from "../leaderboardStore.js";

const DEFAULT_AVATAR_KEY =
    "beginer_m";


/* =========================================================
   ЗАГРУЗИТЬ ГЛОБАЛЬНЫЙ РЕЙТИНГ
   ========================================================= */

export async function loadGlobalLeaderboard(
    {
        refresh = false
    } = {}
) {
    if (
        !refresh
        && hasGlobalLeaderboardData()
    ) {
        return getGlobalLeaderboardData();
    }

    const response =
        await fetchGlobalLeaderboard();

    const leaderboardUsers =
        response.users.map(
            normalizeLeaderboardUser
        );

    const currentUser =
        normalizeCurrentUser(
            response.current_user
        );

    const result = {
        content:
            renderGlobalLeaderboard(
                leaderboardUsers
            ),

        currentUser
    };

    setGlobalLeaderboardData(
        result
    );

    return result;
}


/* =========================================================
   ОТРЕНДЕРИТЬ ГЛОБАЛЬНЫЙ РЕЙТИНГ
   ========================================================= */

function renderGlobalLeaderboard(
    users = []
) {
    const topUsers =
        getTopThree(users);

    const listUsers =
        users.filter(
            (user) => user.rank >= 4
        );

    return renderLeaderboardSection({
        topUsers,
        users: listUsers
    });
}


/* =========================================================
   ПОРЯДОК ТОП-3

   Компонент отображает карточки так:
   2 место | 1 место | 3 место
   ========================================================= */

function getTopThree(
    users = []
) {
    const usersByRank =
        new Map(
            users.map(
                (user) => [
                    user.rank,
                    user
                ]
            )
        );

    return [
        usersByRank.get(2),
        usersByRank.get(1),
        usersByRank.get(3)
    ].filter(Boolean);
}


/* =========================================================
   НОРМАЛИЗОВАТЬ ПОЛЬЗОВАТЕЛЯ РЕЙТИНГА
   ========================================================= */

function normalizeLeaderboardUser(
    user
) {
    return {
        rank:
            normalizePositiveInteger(
                user?.rank
            ),

        name:
            normalizeName(
                user?.nickname
            ),

        xp:
            formatXp(
                user?.total_xp
            ),

        streak:
            normalizeNonNegativeInteger(
                user?.current_streak
            ),

        avatar:
            getAvatarPath(
                user?.avatar_key
            )
    };
}


/* =========================================================
   НОРМАЛИЗОВАТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

function normalizeCurrentUser(
    user
) {
    if (!user) {
        return null;
    }

    return {
        rank:
            normalizePositiveInteger(
                user.rank
            ),

        name: "Вы",

        xp:
            formatXp(
                user.total_xp
            ),

        streak:
            normalizeNonNegativeInteger(
                user.current_streak
            ),

        avatar:
            getAvatarPath(
                user.avatar_key
            )
    };
}


/* =========================================================
   ПУТЬ К АВАТАРУ
   ========================================================= */

function getAvatarPath(
    avatarKey
) {
    const safeAvatarKey =
        normalizeAvatarKey(
            avatarKey
        );

    return (
        `/img/profile/avatar/`
        + `${safeAvatarKey}.png`
    );
}


function normalizeAvatarKey(
    avatarKey
) {
    const value =
        String(
            avatarKey || ""
        ).trim();

    if (
        !/^[a-zA-Z0-9_-]+$/.test(
            value
        )
    ) {
        return DEFAULT_AVATAR_KEY;
    }

    return value;
}


/* =========================================================
   ФОРМАТ XP
   ========================================================= */

function formatXp(
    value
) {
    const xp =
        normalizeNonNegativeInteger(
            value
        );

    return new Intl.NumberFormat(
        "ru-RU"
    )
        .format(xp)
        .replaceAll(
            "\u00A0",
            " "
        )
        .replaceAll(
            "\u202F",
            " "
        );
}


/* =========================================================
   ЧИСЛА
   ========================================================= */

function normalizePositiveInteger(
    value
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
        || number < 1
    ) {
        return 1;
    }

    return Math.floor(number);
}


function normalizeNonNegativeInteger(
    value
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
        || number < 0
    ) {
        return 0;
    }

    return Math.floor(number);
}


/* =========================================================
   ИМЯ
   ========================================================= */

function normalizeName(
    value
) {
    const name =
        String(
            value || ""
        ).trim();

    return name || "Пользователь";
}