import {
    renderProfileSectionHeader
} from "../profileComponents.js";

import {
    fetchProfileSeasonHistory,
    fetchProfileStats
} from "./profileStatsApi.js";

import {
    RESOURCE_KEYS,
    registerResource,
    getResource,
    peekResource
} from "../../core/resourceCache.js";


import {
    t
} from "../../../i18n/core/i18n.js";

import {
    getPluralForm
} from "../../../i18n/core/plural.js";


/* =========================================================
   PROFILE STATS
   ========================================================= */


const PERIODS = [
    "week",
    "month",
    "year",
];


const WEEKDAY_KEYS = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
];








let currentPeriod = "week";

/* =========================================================
   RESOURCE CACHE
   ========================================================= */

const STATS_RESOURCE_KEYS = {
    week: RESOURCE_KEYS.STATS_WEEK,
    month: RESOURCE_KEYS.STATS_MONTH,
    year: RESOURCE_KEYS.STATS_YEAR,
};


PERIODS.forEach((period) => {
    registerResource(
        STATS_RESOURCE_KEYS[period],
        () => fetchProfileStats(period),
    );
});


registerResource(
    RESOURCE_KEYS.STATS_SEASONS,
    () => fetchProfileSeasonHistory(),
);


async function getStatsData(
    period,
    force = false,
) {
    const resourceKey =
        STATS_RESOURCE_KEYS[period];

    if (!resourceKey) {
        throw new Error(
            `Неизвестный период статистики: ${period}`,
        );
    }

    return getResource(
        resourceKey,
        {
            force,
        },
    );
}


function getCachedStats(
    period,
) {
    const resourceKey =
        STATS_RESOURCE_KEYS[period];

    return resourceKey
        ? peekResource(resourceKey)
        : null;
}


/* =========================================================
   PERIOD HELPERS
   ========================================================= */

function getPreviousPeriodLabel(period) {
    return t(
        `profile.stats.previous.${period}`
    );
}


function getCurrentPeriodLabel(period) {
    return t(
        `profile.stats.current.${period}`
    );
}


function getAchievementsPeriodLabel(period) {
    return t(
        `profile.stats.achievements.${period}`
    );
}


/* =========================================================
   WORD FORMS
   ========================================================= */

function formatConfirmations(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        );

    const form =
        getPluralForm(count);

    return t(
        `profile.stats.confirmations.${form}`,
        {
            count
        }
    );
}


function formatDays(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        );

    const form =
        getPluralForm(count);

    return t(
        `profile.stats.days.${form}`,
        {
            count
        }
    );
}


function formatInvitations(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        );

    const form =
        getPluralForm(count);

    return t(
        `profile.stats.invitations.${form}`,
        {
            count
        }
    );
}


/* =========================================================
   CHANGE
   ========================================================= */

function renderChange(
    change,
    period,
) {
    if (
        !change ||
        typeof change !== "object"
    ) {
        return "";
    }

    const previousLabel =
        getPreviousPeriodLabel(
            period,
        );

    if (
        change.direction === "new"
    ) {
        return `
            <div
                class="
                    profile-stats-change
                    profile-stats-change--up
                "
            >
                <span class="material-symbols-rounded">
                    north_east
                </span>

                <span>
                    ${t("profile.stats.change.new")}
                </span>
            </div>
        `;
    }

    const percent =
        Number(
            change.percent || 0,
        );

    if (
        change.direction === "up"
    ) {
        return `
            <div
                class="
                    profile-stats-change
                    profile-stats-change--up
                "
            >
                <span class="material-symbols-rounded">
                    north_east
                </span>

                <span>
                    ${percent}% · ${previousLabel}
                </span>
            </div>
        `;
    }

    if (
        change.direction === "down"
    ) {
        return `
            <div
                class="
                    profile-stats-change
                    profile-stats-change--down
                "
            >
                <span class="material-symbols-rounded">
                    south_east
                </span>

                <span>
                    ${percent}% · ${previousLabel}
                </span>
            </div>
        `;
    }

    return `
        <div
            class="
                profile-stats-change
                profile-stats-change--same
            "
        >
            <span>
                — 0% · ${previousLabel}
            </span>
        </div>
    `;
}


/* =========================================================
   PERIOD SWITCHER
   ========================================================= */

function renderPeriodSwitcher(
    activePeriod,
) {
    return `
        <div class="profile-stats-periods">

            ${PERIODS
                .map(
                    (period) => `
                        <button
                            type="button"
                            class="
                                profile-stats-period
                                ${
                                    period ===
                                    activePeriod
                                        ? "is-active"
                                        : ""
                                }
                            "
                            data-profile-stats-period="${period}"
                        >
                            ${t(`profile.stats.period.${period}`)}
                        </button>
                    `
                )
                .join("")}

        </div>
    `;
}


/* =========================================================
   WEEKDAY ACTIVITY
   ========================================================= */

function renderWeekdayActivity(
    data,
) {
    const weekdays =
        Array.isArray(
            data.weekday_activity,
        )
            ? data.weekday_activity
            : [];

    const maxValue =
        Math.max(
            1,
            ...weekdays.map(
                (item) =>
                    Number(
                        item.confirmations || 0,
                    )
            ),
        );

    const bestKey =
        data.best_weekday?.key ||
        null;

    const bestValue =
        Number(
            data.best_weekday
                ?.confirmations ||
            0,
        );

    return `
        <section
            class="
                profile-stats-card
                profile-stats-activity
            "
        >

            <div class="profile-stats-card__header">

                <h2 class="profile-stats-card__title">
                    ${t("profile.stats.activity.title")}
                </h2>

            </div>


            <div class="profile-stats-weekdays">

                ${weekdays
                    .map(
                        (item) => {
                            const value =
                                Number(
                                    item.confirmations ||
                                    0,
                                );

                            const relative =
                                value > 0
                                    ? Math.max(
                                        14,
                                        (
                                            value /
                                            maxValue
                                        ) *
                                        100,
                                    )
                                    : 0;

                            return `
                                <div
                                    class="
                                        profile-stats-weekday
                                        ${
                                            item.key === bestKey
                                                ? "is-best"
                                                : ""
                                        }
                                    "
                                >

                                    <div
                                        class="profile-stats-weekday__value"
                                    >
                                        ${value}
                                    </div>

                                    <div
                                        class="profile-stats-weekday__track"
                                    >
                                        <div
                                            class="profile-stats-weekday__bar"
                                            style="
                                                height:
                                                ${relative}%;
                                            "
                                        ></div>
                                    </div>

                                    <div
                                        class="profile-stats-weekday__label"
                                    >
                                        ${t(
                                            `profile.stats.weekday.short.${item.key}`
                                        )}
                                    </div>

                                </div>
                            `;
                        }
                    )
                    .join("")}

            </div>


            ${
                data.best_weekday
                    ? `
                        <div
                            class="
                                profile-stats-best-day
                            "
                        >
                            <span
                                class="
                                    material-symbols-rounded
                                    profile-stats-best-day__icon
                                "
                                aria-hidden="true"
                            >
                                star
                            </span>

                            <span>
                                ${t(
                                    "profile.stats.activity.best",
                                    {
                                        weekday: t(
                                            `profile.stats.weekday.best.${bestKey}`
                                        ),
                                        confirmations:
                                            formatConfirmations(
                                                bestValue
                                            )
                                    }
                                )}
                            </span>
                        </div>
                    `
                    : `
                        <div
                            class="
                                profile-stats-best-day
                                profile-stats-best-day--empty
                            "
                        >
                            ${t("profile.stats.activity.empty")}
                        </div>
                    `
            }

        </section>
    `;
}


/* =========================================================
   MAIN METRICS
   ========================================================= */

function renderMainStats(
    data,
) {
    return `
        <section class="profile-stats-metrics">

            <article class="profile-stats-metric">

                <div
                    class="
                        profile-stats-metric__icon
                        profile-stats-metric__icon--confirmations
                    "
                >
                    <span class="material-symbols-rounded">
                        check
                    </span>
                </div>


                <div class="profile-stats-metric__content">

                    <div class="profile-stats-metric__label">
                        ${t("profile.stats.metric.confirmations")}
                    </div>

                    <div class="profile-stats-metric__value">
                        ${data.confirmations.value}
                    </div>

                    <div class="profile-stats-metric__period">
                        ${getCurrentPeriodLabel(
                            data.period,
                        )}
                    </div>

                </div>


                ${renderChange(
                    data.confirmations.change,
                    data.period,
                )}

            </article>


            <article class="profile-stats-metric">

                <div
                    class="
                        profile-stats-metric__icon
                        profile-stats-metric__icon--xp
                    "
                >
                    <span class="material-symbols-rounded">
                        workspace_premium
                    </span>
                </div>


                <div class="profile-stats-metric__content">

                    <div class="profile-stats-metric__label">
                        ${t("profile.stats.metric.xp")}
                    </div>

                    <div class="profile-stats-metric__value">
                        ${data.xp.value}
                        <span>XP</span>
                    </div>

                    <div class="profile-stats-metric__period">
                        ${getCurrentPeriodLabel(
                            data.period,
                        )}
                    </div>

                </div>


                ${renderChange(
                    data.xp.change,
                    data.period,
                )}

            </article>

        </section>
    `;
}


/* =========================================================
   SVG HELPERS
   ========================================================= */

function getPointX(
    index,
    count,
    width,
    left,
    right,
) {
    if (count <= 1) {
        return width / 2;
    }

    return (
        left +
        (
            index /
            (count - 1)
        ) *
        (
            width -
            left -
            right
        )
    );
}


function getPointY(
    score,
    maxScore,
    height,
    top,
    bottom,
) {
    const safeMax =
        Math.max(
            1,
            maxScore,
        );

    return (
        height -
        bottom -
        (
            score /
            safeMax
        ) *
        (
            height -
            top -
            bottom
        )
    );
}


/* =========================================================
   CURVED SVG PATH
   ========================================================= */

function buildSmoothPath(
    points,
) {
    if (!points.length) {
        return "";
    }

    if (points.length === 1) {
        return `
            M
            ${points[0].x}
            ${points[0].y}
        `;
    }

    let path =
        `M ${points[0].x} ${points[0].y}`;

    for (
        let index = 0;
        index < points.length - 1;
        index += 1
    ) {
        const current =
            points[index];

        const next =
            points[index + 1];

        const middleX =
            (
                current.x +
                next.x
            ) / 2;

        path += `
            C
            ${middleX}
            ${current.y},
            ${middleX}
            ${next.y},
            ${next.x}
            ${next.y}
        `;
    }

    return path;
}


/* =========================================================
   GRAPH LABEL
   ========================================================= */

function getGraphLabel(
    point,
    index,
    total,
    period,
) {
    if (period === "week") {
        const source =
            point.date
                ? new Date(
                    `${point.date}T12:00:00`,
                )
                : null;

        if (!source) {
            return "";
        }

        const day =
            source.getDay();

        const mapping = [
            "sun",
            "mon",
            "tue",
            "wed",
            "thu",
            "fri",
            "sat",
        ];

        return t(
            `profile.stats.weekday.short.${mapping[day]}`
        );
    }

    if (period === "year") {
        if (point.month) {
            const monthIndex =
                Number(
                    point.month.split("-")[1],
                ) - 1;

            return t(
                `profile.stats.month.${monthIndex}`
            );
        }

        return "";
    }

    /*
     * МЕСЯЦ:
     * не подписываем все 30 точек.
     */

    if (
        index !== 0 &&
        index !== total - 1 &&
        index % 7 !== 0
    ) {
        return "";
    }

    if (!point.date) {
        return "";
    }

    return String(
        Number(
            point.date.split("-")[2],
        )
    );
}


/* =========================================================
   DYNAMICS GRAPH
   ========================================================= */

function renderDynamicsGraph(
    data,
) {
    const sourcePoints =
        Array.isArray(
            data.activity_dynamics
                ?.points,
        )
            ? data.activity_dynamics
                .points
            : [];

    if (!sourcePoints.length) {
        return `
            <div class="profile-stats-chart-empty">
                ${t("profile.stats.chart.empty")}
            </div>
        `;
    }

    const width = 320;
    const height = 164;

    const padding = {
        left: 12,
        right: 12,
        top: 30,
        bottom: 30,
    };

    const maxScore =
        Math.max(
            4,
            ...sourcePoints.map(
                (item) =>
                    Number(
                        item.score || 0,
                    )
            ),
        );

    const svgPoints =
        sourcePoints.map(
            (point, index) => ({
                ...point,

                x: getPointX(
                    index,
                    sourcePoints.length,
                    width,
                    padding.left,
                    padding.right,
                ),

                y: getPointY(
                    Number(
                        point.score || 0,
                    ),
                    maxScore,
                    height,
                    padding.top,
                    padding.bottom,
                ),
            })
        );

    const linePath =
        buildSmoothPath(
            svgPoints,
        );

    const baseY =
        height -
        padding.bottom;

    const areaPath =
        svgPoints.length
            ? `
                ${linePath}
                L
                ${svgPoints[
                    svgPoints.length - 1
                ].x}
                ${baseY}
                L
                ${svgPoints[0].x}
                ${baseY}
                Z
            `
            : "";

    return `
        <div class="profile-stats-chart">

            <svg
                class="profile-stats-chart__svg"
                viewBox="
                    0 0
                    ${width}
                    ${height}
                "
                preserveAspectRatio="none"
                aria-hidden="true"
            >

                <defs>

                    <linearGradient
                        id="profileStatsAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stop-color="#6d9d56"
                            stop-opacity="0.20"
                        />

                        <stop
                            offset="100%"
                            stop-color="#6d9d56"
                            stop-opacity="0.015"
                        />
                    </linearGradient>

                </defs>


                <line
                    x1="${padding.left}"
                    y1="${baseY}"
                    x2="${width - padding.right}"
                    y2="${baseY}"
                    class="profile-stats-chart__baseline"
                />


                <path
                    d="${areaPath}"
                    class="profile-stats-chart__area"
                />


                <path
                    d="${linePath}"
                    class="profile-stats-chart__line"
                />


                ${svgPoints
                    .map(
                        (point) => `
                            <circle
                                cx="${point.x}"
                                cy="${point.y}"
                                r="3.8"
                                class="
                                    profile-stats-chart__point
                                "
                            />
                        `
                    )
                    .join("")}


                ${svgPoints
                    .map(
                        (point) => {
                            const achievements =
                                Array.isArray(
                                    point.achievements,
                                )
                                    ? point
                                        .achievements
                                    : [];

                            if (
                                !achievements.length
                            ) {
                                return "";
                            }

                            const markerY =
                                Math.max(
                                    12,
                                    point.y - 18,
                                );

                            return `
                                <g
                                    class="
                                        profile-stats-chart__achievement
                                    "
                                >
                                    <line
                                        x1="${point.x}"
                                        y1="${point.y - 5}"
                                        x2="${point.x}"
                                        y2="${markerY + 7}"
                                        class="
                                            profile-stats-chart__achievement-line
                                        "
                                    />

                                    <circle
                                        cx="${point.x}"
                                        cy="${markerY}"
                                        r="8"
                                        class="
                                            profile-stats-chart__achievement-medal
                                        "
                                    />

                                    <text
                                        x="${point.x}"
                                        y="${markerY + 3}"
                                        text-anchor="middle"
                                        class="
                                            profile-stats-chart__achievement-star
                                        "
                                    >
                                        ★
                                    </text>
                                </g>
                            `;
                        }
                    )
                    .join("")}

            </svg>


            <div class="profile-stats-chart__labels">

                ${svgPoints
                    .map(
                        (point, index) => `
                            <span>
                                ${getGraphLabel(
                                    point,
                                    index,
                                    svgPoints.length,
                                    data.period,
                                )}
                            </span>
                        `
                    )
                    .join("")}

            </div>

        </div>
    `;
}


/* =========================================================
   ACHIEVEMENT HELPERS
   ========================================================= */

function getAchievementImage(
    achievement,
) {
    if (
        !achievement?.type ||
        !achievement?.image
    ) {
        return "";
    }

    return (
        `/img/profile/achievements/` +
        `${achievement.type}/` +
        `${achievement.image}`
    );
}


function getAchievementLabel(
    achievement,
) {
    const target =
        Number(
            achievement?.target || 0,
        );

    if (
        achievement?.type ===
        "streak"
    ) {
        return formatDays(target);
    }

    if (
        achievement?.type ===
        "invitation"
    ) {
        return formatInvitations(target);
    }

    return formatConfirmations(target);
}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function renderAchievements(
    data,
) {
    const achievements =
        Array.isArray(
            data.achievements,
        )
            ? data.achievements
            : [];

    if (!achievements.length) {
        return "";
    }

    return `
        <div class="profile-stats-achievements">

            <div class="profile-stats-achievements__title">
                ${getAchievementsPeriodLabel(
                    data.period,
                )}
            </div>


            <div class="profile-stats-achievements__list">

                ${achievements
                    .map(
                        (achievement) => {
                            const image =
                                getAchievementImage(
                                    achievement,
                                );

                            return `
                                <article
                                    class="
                                        profile-stats-achievement
                                    "
                                >

                                    ${
                                        image
                                            ? `
                                                <img
                                                    src="${image}"
                                                    class="
                                                        profile-stats-achievement__image
                                                    "
                                                    alt=""
                                                    draggable="false"
                                                >
                                            `
                                            : `
                                                <div
                                                    class="
                                                        profile-stats-achievement__fallback
                                                    "
                                                >
                                                    <span
                                                        class="
                                                            material-symbols-rounded
                                                        "
                                                    >
                                                        workspace_premium
                                                    </span>
                                                </div>
                                            `
                                    }

                                    <span
                                        class="
                                            profile-stats-achievement__label
                                        "
                                    >
                                        ${getAchievementLabel(
                                            achievement,
                                        )}
                                    </span>

                                </article>
                            `;
                        }
                    )
                    .join("")}

            </div>

        </div>
    `;
}


/* =========================================================
   DYNAMICS
   ========================================================= */

function renderDynamics(
    data,
) {
    return `
        <section
            class="
                profile-stats-card
                profile-stats-dynamics
            "
        >

            <div class="profile-stats-card__header">

                <h2 class="profile-stats-card__title">
                    ${t("profile.stats.dynamics.title")}
                </h2>

            </div>


            ${renderDynamicsGraph(
                data,
            )}


            ${renderAchievements(
                data,
            )}


            <p class="profile-stats-dynamics__hint">
                ${t("profile.stats.dynamics.hint")}
            </p>

        </section>
    `;
}


/* =========================================================
   LOADING
   ========================================================= */

function renderLoading(
    root,
) {
    root.innerHTML = `
        <section class="profile-stats-page">

            ${renderProfileSectionHeader(
                t("profile.stats.title")
            )}

            <main class="profile-stats-body">

                <div
                    class="
                        profile-stats-loading
                    "
                >
                    <div
                        class="
                            profile-stats-loading__spinner
                        "
                    ></div>

                    <span>
                        ${t("profile.stats.loading")}
                    </span>
                </div>

            </main>

        </section>
    `;
}


/* =========================================================
   ERROR
   ========================================================= */

function renderError(
    root,
    error,
) {
    console.error(
        "Profile stats error:",
        error,
    );

    root.innerHTML = `
        <section class="profile-stats-page">

            ${renderProfileSectionHeader(
                t("profile.stats.title")
            )}

            <main class="profile-stats-body">

                <div
                    class="
                        profile-stats-error
                    "
                >
                    <span class="material-symbols-rounded">
                        error_outline
                    </span>

                    <strong>
                        ${t("profile.stats.error.title")}
                    </strong>

                    <p>
                        ${t("profile.stats.error.text")}
                    </p>
                </div>

            </main>

        </section>
    `;
}




/* =========================================================
   SEASON HISTORY
   ========================================================= */

function formatSeasonDate(value) {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    if (parts.length !== 3) {
        return String(value);
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}


function renderSeasonHistory(history) {
    const seasons = Array.isArray(history)
        ? history
        : [];

    if (!seasons.length) {
        return "";
    }

    return `
        <section
            class="
                profile-stats-card
                profile-stats-seasons
            "
        >
            <div class="profile-stats-card__header">
                <h2 class="profile-stats-card__title">
                    ${t("profile.stats.seasons.title")}
                </h2>
            </div>

            <div class="profile-stats-seasons__list">
                ${seasons
                    .map((season) => `
                        <article class="profile-stats-season">
                            <div class="profile-stats-season__badge">
                                <span class="material-symbols-rounded">
                                    workspace_premium
                                </span>
                            </div>

                            <div class="profile-stats-season__info">
                                <div class="profile-stats-season__title-row">
                                    <strong class="profile-stats-season__title">
                                        ${t("profile.stats.seasons.season", {
                                            number: Number(season.season_number) || 0,
                                        })}
                                    </strong>

                                    <span class="profile-stats-season__status">
                                        ${t("profile.stats.seasons.completed")}
                                    </span>
                                </div>

                                <span class="profile-stats-season__dates">
                                    ${formatSeasonDate(season.start_date)} – ${formatSeasonDate(season.end_date)}
                                </span>
                            </div>

                            <div class="profile-stats-season__result">
                                <strong class="profile-stats-season__rank">
                                    #${Number(season.final_rank) || 0}
                                </strong>

                                <span class="profile-stats-season__xp">
                                    ${Number(season.final_xp) || 0} XP
                                </span>
                            </div>
                        </article>
                    `)
                    .join("")}
            </div>
        </section>
    `;
}


/* =========================================================
   RENDER CONTENT
   ========================================================= */

function renderStatsContent(
    root,
    data,
    seasonHistory = [],
) {
    root.innerHTML = `
        <section class="profile-stats-page">

            ${renderProfileSectionHeader(
                t("profile.stats.title")
            )}

            <main class="profile-stats-body">

                ${renderPeriodSwitcher(
                    data.period,
                )}

                ${renderWeekdayActivity(
                    data,
                )}

                ${renderMainStats(
                    data,
                )}

                ${renderDynamics(
                    data,
                )}

                ${renderSeasonHistory(
                    seasonHistory,
                )}

            </main>

        </section>
    `;

    bindStatsEvents(
        root,
    );
}


/* =========================================================
   LOAD PERIOD
   ========================================================= */

async function loadStatsPeriod(
    root,
    period,
) {
    currentPeriod =
        period;

    try {

        const [
            data,
            seasonHistory,
        ] = await Promise.all([
            getStatsData(
                period,
            ),
            getResource(
                RESOURCE_KEYS.STATS_SEASONS,
            ),
        ]);

        /*
         * Пользователь мог переключиться
         * на другой период пока запрос выполнялся.
         */

        if (
            currentPeriod !==
            period
        ) {
            return;
        }

        renderStatsContent(
            root,
            data,
            seasonHistory,
        );

    } catch (error) {

        if (
            currentPeriod !==
            period
        ) {
            return;
        }

        renderError(
            root,
            error,
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindStatsEvents(
    root,
) {
    const buttons =
        root.querySelectorAll(
            "[data-profile-stats-period]"
        );

    buttons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const period =
                        button.dataset
                            .profileStatsPeriod;

                    if (
                        !period ||
                        period === currentPeriod
                    ) {
                        return;
                    }

                    loadStatsPeriod(
                        root,
                        period,
                    );
                }
            );
        }
    );
}


/* =========================================================
   PAGE
   ========================================================= */

export function renderProfileStatsPage(
    root,
) {
    const cached =
        getCachedStats(
            currentPeriod,
        );

    if (cached) {
        const cachedSeasons =
            peekResource(
                RESOURCE_KEYS.STATS_SEASONS,
            );

        if (cachedSeasons) {
            renderStatsContent(
                root,
                cached,
                cachedSeasons,
            );

            return;
        }
    }

    renderLoading(
        root,
    );

    loadStatsPeriod(
        root,
        currentPeriod,
    );
}