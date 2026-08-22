import {
    t
} from "../../../i18n/core/i18n.js";

import {
    fetchSeasonLeaderboard
} from "../leaderboardApi.js";

import {
    renderLeaderboardSection
} from "../leaderboardSection.js";

import {
    RESOURCE_KEYS,
    registerResource,
    getResource
} from "../../core/resourceCache.js";


const DEFAULT_AVATAR_KEY =
    "standard_m_01";


/* =========================================================
   РЕГИСТРАЦИЯ РЕСУРСА
   ========================================================= */

registerResource(
    RESOURCE_KEYS.LEADERBOARD_SEASON,
    fetchAndBuildSeasonLeaderboard
);


/* =========================================================
   ЗАГРУЗИТЬ СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

export function loadSeasonLeaderboard(
    {
        refresh = false
    } = {}
) {
    return getResource(
        RESOURCE_KEYS.LEADERBOARD_SEASON,
        {
            force: refresh
        }
    );
}


/* =========================================================
   ПОЛУЧИТЬ И СОБРАТЬ СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

async function fetchAndBuildSeasonLeaderboard() {
    const response =
        await fetchSeasonLeaderboard();

    return buildSeasonLeaderboardResource(response);
}


export function buildSeasonLeaderboardResource(response) {
    const leaderboardUsers =
        Array.isArray(response?.users)
            ? response.users.map(
                normalizeLeaderboardUser
            )
            : [];

    const currentUser =
        normalizeCurrentUser(
            response?.current_user
        );

    const season =
        normalizeSeason(
            response?.season
        );

    return {
        users: leaderboardUsers,
        currentUser,
        season
    };
}


/* =========================================================
   ОТРЕНДЕРИТЬ СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

export function renderSeasonLeaderboard(
    users = []
) {
    if (!users.length) {
        return renderEmptySeason();
    }

    const topUsers =
        getTopThree(users);

    const listUsers =
        users.filter(
            (user) =>
                user.rank >= 4
        );

    return renderLeaderboardSection({
        topUsers,
        users: listUsers
    });
}


/* =========================================================
   ПУСТОЙ СЕЗОН
   ========================================================= */

function renderEmptySeason() {
    return `
        <div
            class="
                leaderboard-state
                leaderboard-state--empty
            "
        >
            <div
                class="
                    leaderboard-state__icon
                "
                aria-hidden="true"
            >
                🏆
            </div>

            <div
                class="
                    leaderboard-state__title
                "
            >
                ${t("leaderboard.season.emptyTitle")}
            </div>

            <div
                class="
                    leaderboard-state__text
                "
            >
                ${t("leaderboard.season.emptyText")}
            </div>
        </div>
    `;
}


/* =========================================================
   ПОРЯДОК ТОП-3

   Отображение:
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
   НОРМАЛИЗОВАТЬ ПОЛЬЗОВАТЕЛЯ
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
                getSeasonXp(user)
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
   XP СЕЗОНА
   ========================================================= */

function getSeasonXp(
    user
) {
    if (
        user?.season_xp !==
        undefined
    ) {
        return user.season_xp;
    }

    if (
        user?.xp !==
        undefined
    ) {
        return user.xp;
    }

    if (
        user?.total_xp !==
        undefined
    ) {
        return user.total_xp;
    }

    return 0;
}


/* =========================================================
   ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
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
                getSeasonXp(user)
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
   СЕЗОН
   ========================================================= */

function normalizeSeason(
    season
) {
    if (!season) {
        return null;
    }

    const number =
        normalizePositiveInteger(
            season.number
            ?? season.id
            ?? 1
        );

    const startDate =
        normalizeDate(
            season.start_date
            ?? season.startDate
        );

    const endDate =
        normalizeDate(
            season.end_date
            ?? season.endDate
        );

    return {
        number,
        startDate,
        endDate
    };
}


/* =========================================================
   ДАТА
   ========================================================= */

function normalizeDate(
    value
) {
    if (!value) {
        return "";
    }

    const date =
        String(value)
            .trim()
            .slice(0, 10);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            date
        )
    ) {
        return "";
    }

    return date;
}


/* =========================================================
   АВАТАР
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
   ПОЛОЖИТЕЛЬНОЕ ЧИСЛО
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


/* =========================================================
   НЕОТРИЦАТЕЛЬНОЕ ЧИСЛО
   ========================================================= */

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