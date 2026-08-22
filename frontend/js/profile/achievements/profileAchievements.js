import {
    renderProfileSectionHeader
} from "../profileComponents.js"

import {
    fetchProfileAchievements
} from "./profileAchievementsApi.js"

import {
    RESOURCE_KEYS,
    registerResource,
    peekResource
} from "../../core/resourceCache.js"


import {
    getLanguage,
    t
} from "../../../i18n/core/i18n.js"

import {
    getPluralForm
} from "../../../i18n/core/plural.js"

registerResource(
    RESOURCE_KEYS.ACHIEVEMENTS,
    fetchProfileAchievements
)


/* =========================================================
   HELPERS
   ========================================================= */


/* =========================================================
   ДНИ
   ========================================================= */

function formatDays(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        )

    const form =
        getPluralForm(count)

    return t(
        `profile.achievements.days.${form}`,
        {
            count
        }
    )
}


/* =========================================================
   ДРУЗЬЯ
   ========================================================= */

function formatFriends(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        )

    const form =
        getPluralForm(count)

    return t(
        `profile.achievements.friends.${form}`,
        {
            count
        }
    )
}


function formatConfirmations(value) {
    const count =
        Math.abs(
            Math.trunc(
                Number(value) || 0
            )
        )

    const form =
        getPluralForm(count)

    return t(
        `profile.achievements.confirmations.${form}`,
        {
            count
        }
    )
}


/* =========================================================
   ФОРМАТ ДАТЫ
   ========================================================= */

function formatAchievementDate(
    value
) {
    if (!value) {
        return ""
    }


    const date =
        new Date(value)


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return ""
    }


    const localeByLanguage = {
        ru: "ru-RU",
        uk: "uk-UA",
        en: "en-US"
    }

    const locale =
        localeByLanguage[getLanguage()]
        || localeByLanguage.ru

    return date.toLocaleDateString(
        locale,
        {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        }
    )
}


/* =========================================================
   ПУТЬ К PNG
   ========================================================= */

function getAchievementImagePath(
    achievement
) {
    const image =
        String(
            achievement?.image || ""
        ).trim()


    if (!image) {
        return ""
    }


    // =====================================================
    // CONFIRMATION
    // =====================================================

    if (
        achievement.type ===
        "confirmation"
    ) {
        return (
            `/img/profile/achievements/confirmation/${image}`
        )
    }


    // =====================================================
    // INVITATION
    // =====================================================

    if (
        achievement.type ===
        "invitation"
    ) {
        return (
            `/img/profile/achievements/invitation/${image}`
        )
    }


    // =====================================================
    // STREAK
    // =====================================================

    return (
        `/img/profile/achievements/streak/${image}`
    )
}


/* =========================================================
   НАЗВАНИЕ ПОЛУЧЕННОГО ДОСТИЖЕНИЯ
   ========================================================= */

function getAchievementLabel(
    achievement
) {
    const target =
        Number(
            achievement?.target || 0
        )


    // =====================================================
    // CONFIRMATION
    // =====================================================

    if (
        achievement?.type ===
        "confirmation"
    ) {
        return (
            formatConfirmations(target)
        )
    }


    // =====================================================
    // INVITATION
    // =====================================================

    if (
        achievement?.type ===
        "invitation"
    ) {
        return (
            formatFriends(target)
        )
    }


    // =====================================================
    // STREAK
    // =====================================================

    return (
        formatDays(target)
    )
}


/* =========================================================
   ALT ДЛЯ PNG
   ========================================================= */

function getAchievementAlt(
    achievement
) {
    const target =
        Number(
            achievement?.target || 0
        )


    if (
        achievement?.type ===
        "confirmation"
    ) {
        return (
            t(
                "profile.achievements.alt.confirmation",
                {
                    target
                }
            )
        )
    }


    if (
        achievement?.type ===
        "invitation"
    ) {
        return (
            t(
                "profile.achievements.alt.invitation",
                {
                    target
                }
            )
        )
    }


    return (
        t(
            "profile.achievements.alt.streak",
            {
                target
            }
        )
    )
}


/* =========================================================
   ПОЛУЧЕННЫЕ ДОСТИЖЕНИЯ
   ========================================================= */

function renderReceivedAchievements(
    achievements
) {
    if (
        !Array.isArray(achievements) ||
        achievements.length === 0
    ) {
        return `
            <div class="profile-achievements-empty">
                ${t("profile.achievements.received.empty")}
            </div>
        `
    }


    return achievements
        .map(
            (achievement) => {

                const imagePath =
                    getAchievementImagePath(
                        achievement
                    )


                const date =
                    formatAchievementDate(
                        achievement.earned_at
                    )


                const label =
                    getAchievementLabel(
                        achievement
                    )


                const alt =
                    getAchievementAlt(
                        achievement
                    )


                return `
                    <article class="profile-achievement-earned">

                        <div class="profile-achievement-earned__image-wrap">

                            <img
                                class="profile-achievement-earned__image"
                                src="${imagePath}"
                                alt="${alt}"
                                draggable="false"
                            >

                        </div>


                        <div class="profile-achievement-earned__label">
                            ${label}
                        </div>


                        <div class="profile-achievement-earned__date">
                            ${date}
                        </div>

                    </article>
                `
            }
        )
        .join("")
}


/* =========================================================
   ОДНА БЛИЖАЙШАЯ ЦЕЛЬ
   ========================================================= */

function renderNextAchievement(
    achievement
) {
    if (!achievement) {
        return ""
    }


    const target =
        Number(
            achievement.target || 0
        )


    const current =
        Number(
            achievement.current || 0
        )


    const xp =
        Number(
            achievement.xp_reward || 0
        )


    // =====================================================
    // ПРОГРЕСС
    // =====================================================

    const progress =
        target > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (
                        current /
                        target
                    ) * 100
                )
            )
            : 0


    // =====================================================
    // TYPE
    // =====================================================

    const type =
        achievement.type


    // =====================================================
    // DEFAULT = STREAK
    // =====================================================

    let icon =
        "local_fire_department"

    let eyebrow =
        t("profile.achievements.type.streak")

    let title =
        formatDays(target)

    let modifier =
        "streak"


    // =====================================================
    // CONFIRMATION
    // =====================================================

    if (
        type ===
        "confirmation"
    ) {
        icon =
            "check_circle"

        eyebrow =
            t("profile.achievements.type.confirmation")

        title =
            formatConfirmations(target)

        modifier =
            "confirmation"
    }


    // =====================================================
    // INVITATION
    // =====================================================

    if (
        type ===
        "invitation"
    ) {
        icon =
            "group"

        eyebrow =
            t("profile.achievements.type.invitation")

        title =
            formatFriends(target)

        modifier =
            "invitation"
    }


    // =====================================================
    // CSS CLASSES
    // =====================================================

    const iconClass =
        (
            "profile-achievement-goal__icon " +
            `profile-achievement-goal__icon--${modifier}`
        )


    const fillClass =
        (
            "profile-achievement-goal__progress-fill " +
            `profile-achievement-goal__progress-fill--${modifier}`
        )


    // =====================================================
    // HTML
    // =====================================================

    return `
        <article class="profile-achievement-goal">


            <!-- =========================================
                 ICON
                 ========================================= -->

            <div
                class="${iconClass}"
                aria-hidden="true"
            >

                <span class="material-symbols-rounded">
                    ${icon}
                </span>

            </div>


            <!-- =========================================
                 CONTENT
                 ========================================= -->

            <div class="profile-achievement-goal__content">

                <div class="profile-achievement-goal__top">

                    <div class="profile-achievement-goal__text">

                        <div class="profile-achievement-goal__eyebrow">
                            ${eyebrow}
                        </div>


                        <div class="profile-achievement-goal__title">
                            ${title}
                        </div>

                    </div>


                    <div class="profile-achievement-goal__counter">
                        ${current}/${target}
                    </div>

                </div>


                <!-- =====================================
                     PROGRESS
                     ===================================== -->

                <div
                    class="profile-achievement-goal__progress"
                    aria-label="${t(
                        "profile.achievements.progressAria",
                        {
                            current,
                            target
                        }
                    )}"
                >

                    <div
                        class="${fillClass}"
                        style="width: ${progress}%"
                    ></div>

                </div>

            </div>


            <!-- =========================================
                 XP
                 ========================================= -->

            <div class="profile-achievement-goal__reward">

                <div
                    class="profile-achievement-goal__xp-badge"
                    aria-hidden="true"
                >

                    <span
                        class="
                            material-symbols-rounded
                            profile-achievement-goal__xp-shape
                        "
                    >
                        award_star
                    </span>

                </div>


                <div class="profile-achievement-goal__xp-value">
                    +${xp} XP
                </div>

            </div>

        </article>
    `
}


/* =========================================================
   ВСЕ БЛИЖАЙШИЕ ЦЕЛИ
   ========================================================= */

function renderNextAchievements(
    next
) {
    const achievements = [
        next?.streak,
        next?.confirmation,
        next?.invitation
    ].filter(Boolean)


    if (
        achievements.length === 0
    ) {
        return `
            <div class="profile-achievements-empty">
                ${t("profile.achievements.next.empty")}
            </div>
        `
    }


    return achievements
        .map(
            renderNextAchievement
        )
        .join("")
}


/* =========================================================
   КАРКАС СТРАНИЦЫ
   ========================================================= */

function renderAchievementsLayout(
    root
) {
    root.innerHTML = `
        <section class="profile-achievements-page">

            ${renderProfileSectionHeader(
                t("profile.achievements.title")
            )}


            <main class="profile-achievements-body">


                <!-- =========================================
                     SUMMARY
                     ========================================= -->

                <section class="profile-achievements-summary">

                    <div
                        class="profile-achievements-summary__medal"
                        aria-hidden="true"
                    >

                        <span class="material-symbols-rounded">
                            workspace_premium
                        </span>

                    </div>


                    <div
                        class="profile-achievements-summary__value"
                        data-achievements-summary-value
                    >
                        —
                    </div>


                    <div class="profile-achievements-summary__label">
                        ${t("profile.achievements.summary.label")}
                    </div>

                </section>


                <!-- =========================================
                     ПОЛУЧЕННЫЕ
                     ========================================= -->

                <section class="profile-achievements-section">

                    <h2 class="profile-achievements-section__title">
                        ${t("profile.achievements.received.title")}
                    </h2>


                    <div
                        class="profile-achievements-earned-list"
                        data-achievements-earned
                    >
                    </div>

                </section>


                <!-- =========================================
                     БЛИЖАЙШИЕ ЦЕЛИ
                     ========================================= -->

                <section class="profile-achievements-section">

                    <h2 class="profile-achievements-section__title">
                        ${t("profile.achievements.next.title")}
                    </h2>


                    <div
                        class="profile-achievements-goals"
                        data-achievements-next
                    >
                    </div>

                </section>


            </main>

        </section>
    `
}


/* =========================================================
   ОТРИСОВАТЬ ДАННЫЕ
   ========================================================= */

function renderAchievementsData(
    root,
    data
) {
    const summaryElement =
        root.querySelector(
            "[data-achievements-summary-value]"
        )


    const earnedElement =
        root.querySelector(
            "[data-achievements-earned]"
        )


    const nextElement =
        root.querySelector(
            "[data-achievements-next]"
        )


    // =====================================================
    // SUMMARY
    // =====================================================

    if (summaryElement) {
        summaryElement.textContent =
            t(
                "profile.achievements.summary.value",
                {
                    earned: data.earned_count,
                    total: data.total_count
                }
            )
    }


    // =====================================================
    // EARNED
    // =====================================================

    if (earnedElement) {
        earnedElement.innerHTML =
            renderReceivedAchievements(
                data.earned
            )
    }


    // =====================================================
    // NEXT
    // =====================================================

    if (nextElement) {
        nextElement.innerHTML =
            renderNextAchievements(
                data.next
            )
    }
}


/* =========================================================
   ОШИБКА
   ========================================================= */

function renderAchievementsError(
    root
) {
    const earnedElement =
        root.querySelector(
            "[data-achievements-earned]"
        )


    const nextElement =
        root.querySelector(
            "[data-achievements-next]"
        )


    if (earnedElement) {
        earnedElement.innerHTML = `
            <div class="profile-achievements-empty">
                ${t("profile.achievements.error")}
            </div>
        `
    }


    if (nextElement) {
        nextElement.innerHTML = ""
    }
}


/* =========================================================
   СТРАНИЦА
   ========================================================= */

export function renderProfileAchievementsPage(
    root
) {
    // =====================================================
    // СНАЧАЛА РИСУЕМ КАРКАС
    // =====================================================

    renderAchievementsLayout(
        root
    )


    // =====================================================
    // БЕРЁМ ГОТОВЫЕ ДАННЫЕ ИЗ CACHE
    //
    // Achievements уже загружены Bootstrap'ом.
    // Никаких API-запросов при открытии страницы.
    // =====================================================

    const data =
        peekResource(
            RESOURCE_KEYS.ACHIEVEMENTS
        )


    if (!data) {
        console.warn(
            "Achievements отсутствуют в Resource Cache"
        )

        renderAchievementsError(
            root
        )

        return
    }


    // =====================================================
    // ОТРИСОВЫВАЕМ SNAPSHOT
    // =====================================================

    renderAchievementsData(
        root,
        data
    )
}