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
    getResource,
    peekResource
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
        season,
        top3: Array.isArray(response?.top3)
            ? response.top3.map(normalizeLeaderboardUser)
            : [],
        summary: response?.summary || {},
        nextSeason: normalizeSeason(response?.next_season)
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



export function renderFinishedSeason(result) {
    const season = result?.season || {};
    const summary = result?.summary || {};
    const current = result?.currentUser;
    const top3 = getTopThree(result?.top3 || []);
    const next = result?.nextSeason || {};
    const referral = peekResource(RESOURCE_KEYS.REFERRAL);
    const referralLink = referral?.referral_link || "";

    const userResult = current
        ? `<div class="season-finished-user__avatar"><img src="${current.avatar}" alt=""></div>
           <div class="season-finished-user__metric"><span>${t("leaderboard.season.yourPlace")}</span><strong>#${current.rank}</strong></div>
           <div class="season-finished-user__metric"><span>${t("leaderboard.season.earned")}</span><strong>${current.xp} XP</strong></div>`
        : `<div class="season-finished-user__empty">${t("leaderboard.season.noResult")}</div>`;

    return `<div class="season-finished">
        <section class="season-finished-hero">
            <div><h2>${t("leaderboard.season.finishedTitle", {number: season.number})}</h2>
            <div class="season-finished-hero__dates">${formatDate(season.startDate)} – ${formatDate(season.rankingEndDate)}</div>
            <p>${t("leaderboard.season.finishedWork")}<br>${t("leaderboard.season.nextStarts", {date: formatLongDate(next.startDate)})}</p></div>
            <div class="season-finished-hero__cup" aria-hidden="true">🏆</div>
        </section>
        <section class="season-finished-card"><h3>${t("leaderboard.season.yourResults")}</h3><div class="season-finished-user">${userResult}</div></section>
        <section class="season-finished-card"><h3>${t("leaderboard.season.top3Title")}</h3>${top3.length ? renderFinishedTop3(top3) : `<div class="season-finished-empty">—</div>`}</section>
        <section class="season-finished-card"><h3>${t("leaderboard.season.summaryTitle")}</h3>
            <div class="season-summary-grid">
                ${metric("groups", t("leaderboard.season.participants"), summary.participants ?? 0)}
                ${metric("task_alt", t("leaderboard.season.confirmations"), summary.confirmations ?? 0)}
                ${metric("local_fire_department", t("leaderboard.season.bestStreak"), summary.best_streak ?? 0)}
                ${metric("favorite", t("leaderboard.season.popularHabit"), escapeHtml(summary.popular_habit || "—"))}
            </div></section>
        <section class="season-finished-next"><span>${t("leaderboard.season.nextSeason")}</span><strong>${t("leaderboard.season.title", {number: next.number})}</strong><small>${formatDate(next.startDate)} – ${formatDate(next.endDate)}</small></section>
        <button class="season-finished-share" type="button" data-season-share data-referral-link="${escapeAttribute(referralLink)}"><span class="material-symbols-rounded">person_add</span>${t("leaderboard.season.inviteFriend")}</button>
    </div>`;
}

export function bindFinishedSeasonEvents(root) {
    const button = root?.querySelector("[data-season-share]");
    if (!button) return;
    button.addEventListener("click", () => {
        const referralLink = button.dataset.referralLink;
        if (!referralLink) return;
        const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(referralLink)
            + "&text=" + encodeURIComponent(t("profile.referral.shareText"));
        const tg = window.Telegram?.WebApp;
        if (tg && typeof tg.openTelegramLink === "function") tg.openTelegramLink(shareUrl);
        else window.open(shareUrl, "_blank", "noopener,noreferrer");
    });
}

function renderFinishedTop3(users) {
    return `<div class="season-finished-top3">${users.map(user => `<div class="season-finished-top3__item season-finished-top3__item--${user.rank}">
        <span class="season-finished-top3__rank">#${user.rank}</span><img src="${user.avatar}" alt=""><strong>${escapeHtml(user.name)}</strong><small>${user.xp} XP</small></div>`).join("")}</div>`;
}
function metric(icon, label, value) { return `<div class="season-summary-item"><span class="material-symbols-rounded">${icon}</span><div><small>${label}</small><strong>${value}</strong></div></div>`; }
function formatDate(value) { if (!value) return ""; const [y,m,d]=value.split("-"); return `${d}.${m}.${y}`; }
function formatLongDate(value) { return formatDate(value); }
function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function escapeAttribute(value) { return escapeHtml(value); }


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

        rankChange:
            normalizeRankChange(
                user?.rank_change
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

        rankChange:
            normalizeRankChange(
                user.rank_change
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
        status: String(season.status || "active"),
        startDate,
        rankingEndDate: normalizeDate(season.ranking_end_date ?? season.rankingEndDate),
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

function normalizeRankChange(
    value
) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.trunc(number);
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