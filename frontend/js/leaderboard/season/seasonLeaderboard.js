import {
    fetchSeasonLeaderboard
} from "../leaderboardApi.js";

import {
    getSeasonLeaderboardData,
    hasSeasonLeaderboardData,
    setSeasonLeaderboardData
} from "../leaderboardStore.js";

import {
    renderLeaderboardSection
} from "../leaderboardSection.js";


const DEFAULT_AVATAR_KEY =
    "beginer_m";


/* =========================================================
   ЗАГРУЗИТЬ СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

export async function loadSeasonLeaderboard(
    {
        refresh = false
    } = {}
) {
    if (
        !refresh
        && hasSeasonLeaderboardData()
    ) {
        return getSeasonLeaderboardData();
    }

    const response =
        await fetchSeasonLeaderboard();

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

    const result = {
        content:
            renderSeasonLeaderboard(
                leaderboardUsers
            ),

        currentUser,

        season
    };

    setSeasonLeaderboardData(
        result
    );

    return result;
}


/* =========================================================
   ОТРЕНДЕРИТЬ СЕЗОННЫЙ РЕЙТИНГ
   ========================================================= */

function renderSeasonLeaderboard(
    users = []
) {
    if (!users.length) {
        return `
            <div class="leaderboard-empty">
                <span class="material-symbols-rounded leaderboard-empty__icon">
                    emoji_events
                </span>

                <div class="leaderboard-empty__title">
                    В этом сезоне пока нет участников
                </div>

                <div class="leaderboard-empty__text">
                    Подтвердите первую привычку
                    и станьте лидером сезона.
                </div>
            </div>
        `;
    }

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
   НОРМАЛИЗОВАТЬ ДАННЫЕ СЕЗОНА
   ========================================================= */

function normalizeSeason(
    season
) {
    const number =
        normalizePositiveInteger(
            season?.number
        );

    const title =
        normalizeSeasonTitle(
            season?.title,
            number
        );

    const startDate =
        normalizeIsoDate(
            season?.start_date
        );

    const endDate =
        normalizeIsoDate(
            season?.end_date
        );

    return {
        number,
        title,
        startDate,
        endDate
    };
}


function normalizeSeasonTitle(
    value,
    seasonNumber
) {
    const title =
        String(
            value || ""
        ).trim();

    if (title) {
        return title;
    }

    return `Сезон ${seasonNumber}`;
}


function normalizeIsoDate(
    value
) {
    const date =
        String(
            value || ""
        ).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            date
        )
    ) {
        return null;
    }

    const [
        year,
        month,
        day
    ] = date
        .split("-")
        .map(Number);

    const parsedDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    const isValidDate =
        parsedDate.getUTCFullYear() === year
        && parsedDate.getUTCMonth()
            === month - 1
        && parsedDate.getUTCDate() === day;

    return isValidDate
        ? date
        : null;
}


/* =========================================================
   НОРМАЛИЗОВАТЬ УЧАСТНИКА СЕЗОННОГО РЕЙТИНГА
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
                user?.season_xp
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
                user.season_xp
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
        "/img/profile/avatar/"
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