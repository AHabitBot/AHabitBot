import {
    fetchGlobalLeaderboard
} from "../leaderboardApi.js";

import {
    RESOURCE_KEYS,
    registerResource,
    getResource
} from "../../core/resourceCache.js";

import {
    renderLeaderboardSection
} from "../leaderboardSection.js";



const DEFAULT_AVATAR_KEY =
    "standard_m_01";


/* =========================================================
   ЗАГРУЗИТЬ ГЛОБАЛЬНЫЙ РЕЙТИНГ
   ========================================================= */

registerResource(
    RESOURCE_KEYS.LEADERBOARD_GLOBAL,
    fetchAndBuildGlobalLeaderboard
);


export function loadGlobalLeaderboard(
    {
        refresh = false
    } = {}
) {
    return getResource(
        RESOURCE_KEYS.LEADERBOARD_GLOBAL,
        {
            force: refresh
        }
    );
}


async function fetchAndBuildGlobalLeaderboard() {
    const response =
        await fetchGlobalLeaderboard();

    return buildGlobalLeaderboardResource(response);
}


export function renderGlobalLeaderboard(
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


export function buildGlobalLeaderboardResource(response) {
    const leaderboardUsers =
        response.users.map(
            normalizeLeaderboardUser
        );

    const currentUser =
        normalizeCurrentUser(
            response.current_user
        );

    return {
        users: leaderboardUsers,
        currentUser
    };
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
            normalizeNonNegativeInteger(
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

        name: "",
        isCurrentUser: true,

        xp:
            normalizeNonNegativeInteger(
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
        + `avatar_${safeAvatarKey}.png`
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

    return name;
}