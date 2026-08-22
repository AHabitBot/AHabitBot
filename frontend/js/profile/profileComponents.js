import {
    getProfileAvatar,
    getDefaultProfileAvatar
} from "./appearance/profileAppearanceAvatar.js"

import {
    getProfileBackground,
    getDefaultProfileBackground
} from "./appearance/profileAppearanceBackground.js"

import {
    isProfileFeatureEnabled
} from "./profileFeatures.js"

import {
    t
} from "../../i18n/core/i18n.js"


/* =========================================================
   PROFILE V2 — КОМПОНЕНТЫ
   ========================================================= */


/* =========================================================
   БЕЗОПАСНЫЙ ТЕКСТ
   ========================================================= */

function escapeProfileText(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}


/* =========================================================
   ЧИСЛО
   ========================================================= */

function normalizeProfileNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value)

    if (!Number.isFinite(number)) {
        return fallback
    }

    return Math.max(
        0,
        Math.floor(number)
    )
}


/* =========================================================
   КАРТОЧКА ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

export function renderProfileUserCard(
    profile = {}
) {
    const nickname =
        escapeProfileText(
            profile.nickname || "Player"
        )


    /* =====================================================
       AVATAR
       ===================================================== */

    const avatar =
        getProfileAvatar(
            profile.avatar_key
        )
        || getDefaultProfileAvatar()


    /* =====================================================
       BACKGROUND
       ===================================================== */

    const background =
        getProfileBackground(
            profile.background_key
        )
        || getDefaultProfileBackground()


    /* =====================================================
       LEVEL
       ===================================================== */

    const level =
        normalizeProfileNumber(
            profile.level,
            1
        )

    const levelXp =
        normalizeProfileNumber(
            profile.level_xp
        )

    const levelXpRequired =
        Math.max(
            1,
            normalizeProfileNumber(
                profile.level_xp_required,
                20
            )
        )

    const levelProgress =
        Math.min(
            100,
            normalizeProfileNumber(
                profile.level_progress
            )
        )


    /* =====================================================
       NICKNAME
       ===================================================== */

    const nicknameCanChange =
        profile.nickname_can_change === true


    /* =====================================================
       CARD
       ===================================================== */

    return `
        <section
            class="profile-user-card"
            style="
                background-image:
                    url('${background.image}');
            "
        >

            <div class="profile-user-card__top">

                <div class="profile-user-card__avatar-wrap">

                    <img
                        class="profile-user-card__avatar"
                        src="${avatar.image}"
                        alt="${t("profile.main.avatarAlt")}"
                    >

                </div>


                <div class="profile-user-card__info">

                    <div class="profile-user-card__name-row">

                        <h2 class="profile-user-card__name">
                            ${nickname}
                        </h2>

                        ${
                            nicknameCanChange
                                ? `
                                    <span
                                        class="
                                            material-symbols-rounded
                                            profile-user-card__edit-icon
                                        "
                                        data-profile-edit-nickname
                                        role="button"
                                        tabindex="0"
                                        aria-label="${t("profile.main.editNicknameAria")}"
                                    >
                                        edit
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div class="profile-user-card__level">

                        <span
                            class="
                                material-symbols-rounded
                                profile-user-card__level-icon
                            "
                            aria-hidden="true"
                        >
                            shield_with_heart
                        </span>

                        <span class="profile-user-card__level-text">
                            ${t(
                                "profile.main.level",
                                {
                                    level
                                }
                            )}
                        </span>

                    </div>

                </div>

            </div>


            <div class="profile-user-card__progress-row">

                <div
                    class="profile-user-card__progress"
                    aria-label="${t(
                        "profile.main.levelProgressAria",
                        {
                            current: levelXp,
                            required: levelXpRequired
                        }
                    )}"
                >
                    <div
                        class="profile-user-card__progress-fill"
                        style="
                            width: ${levelProgress}%;
                        "
                    ></div>
                </div>


                <div class="profile-user-card__xp">

                    <span class="profile-user-card__xp-current">
                        ${levelXp}
                    </span>

                    <span class="profile-user-card__xp-total">
                        / ${levelXpRequired} XP
                    </span>

                </div>

            </div>

        </section>
    `
}


/* =========================================================
   PROFILE DEVELOPER
   ========================================================= */

const PROFILE_DEVELOPER_TELEGRAM_ID =
    900410719


function isProfileDeveloper() {
    const telegramId =
        Number(
            window.Telegram
                ?.WebApp
                ?.initDataUnsafe
                ?.user
                ?.id
        )

    return (
        telegramId ===
        PROFILE_DEVELOPER_TELEGRAM_ID
    )
}


/* =========================================================
   PROFILE MENU RIGHT ICON
   ========================================================= */

function renderProfileMenuRightIcon(
    feature
) {
    const isAvailable =
        isProfileFeatureEnabled(
            feature
        )

    const isDeveloper =
        isProfileDeveloper()


    if (
        !isAvailable &&
        !isDeveloper
    ) {
        return `
            <span
                class="
                    material-symbols-rounded
                    profile-menu__arrow
                "
                aria-hidden="true"
            >
                lock
            </span>
        `
    }


    return `
        <span
            class="
                material-symbols-rounded
                profile-menu__arrow
            "
            aria-hidden="true"
        >
            chevron_right
        </span>
    `
}


/* =========================================================
   МЕНЮ ПРОФИЛЯ
   ========================================================= */

export function renderProfileMenu(
    profile = {}
) {

    const achievementsEarnedCount =
        normalizeProfileNumber(
            profile.achievements_earned_count
        )

    const achievementsTotalCount =
        normalizeProfileNumber(
            profile.achievements_total_count
        )


    return `
        <section class="profile-menu">

            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="stats"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--stats
                        "
                        aria-hidden="true"
                    >
                        target
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.stats")}
                    </span>

                </div>

                ${renderProfileMenuRightIcon("stats")}

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="achievements"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--achievements
                        "
                        aria-hidden="true"
                    >
                        workspace_premium
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.achievements")}
                    </span>

                </div>

                <div class="profile-menu__right">

<span
    class="profile-menu__value"
    data-profile-achievements-count
>
    ${achievementsEarnedCount}/${achievementsTotalCount}
</span>

                    ${renderProfileMenuRightIcon(
                        "achievements"
                    )}

                </div>

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="appearance"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--appearance
                        "
                        aria-hidden="true"
                    >
                        checkroom
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.appearance")}
                    </span>

                </div>

                ${renderProfileMenuRightIcon(
                    "appearance"
                )}

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="settings"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--settings
                        "
                        aria-hidden="true"
                    >
                        settings
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.settings")}
                    </span>

                </div>

                ${renderProfileMenuRightIcon(
                    "settings"
                )}

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="support"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--support
                        "
                        aria-hidden="true"
                    >
                        help
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.support")}
                    </span>

                </div>

                ${renderProfileMenuRightIcon(
                    "support"
                )}

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="referral"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--invite
                        "
                        aria-hidden="true"
                    >
                        person_add
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.referral")}
                    </span>

                </div>

                <div class="profile-menu__right">

                    <span class="profile-menu__reward">
                        +5 XP
                    </span>

                    ${renderProfileMenuRightIcon(
                        "referral"
                    )}

                </div>

            </button>


            <button
                type="button"
                class="profile-menu__item"
                data-profile-page="archive"
            >
                <div class="profile-menu__left">

                    <span
                        class="
                            material-symbols-rounded
                            profile-menu__icon
                            profile-menu__icon--archive
                        "
                        aria-hidden="true"
                    >
                        inventory_2
                    </span>

                    <span class="profile-menu__label">
                        ${t("profile.main.menu.archive")}
                    </span>

                </div>

                ${renderProfileMenuRightIcon(
                    "archive"
                )}

            </button>

        </section>
    `
}

/* =========================================================
   HEADER ВНУТРЕННИХ РАЗДЕЛОВ
   ========================================================= */

export function renderProfileSectionHeader(
    title
) {
    return `
        <header class="profile-section-header">

            <button
                type="button"
                class="profile-section-header__back"
                data-profile-back
                aria-label="${t("profile.main.sectionBackAria")}"
            >
                <span
                    class="material-symbols-rounded"
                    aria-hidden="true"
                >
                    arrow_back_ios_new
                </span>
            </button>

            <h1 class="profile-section-header__title">
                ${escapeProfileText(title)}
            </h1>

            <div
                class="profile-section-header__spacer"
                aria-hidden="true"
            ></div>

        </header>
    `
}


/* =========================================================
   ОБНОВИТЬ КАРТОЧКУ ПРОФИЛЯ В DOM
   ========================================================= */

export function updateProfileUserCard(
    root,
    profile = {}
) {
    if (!root) {
        return
    }

    const slot =
        root.querySelector(
            "[data-profile-user-card-slot]"
        )

    if (!slot) {
        return
    }

    slot.innerHTML =
        renderProfileUserCard(
            profile
        )
}


/* =========================================================
   ОБНОВИТЬ СЧЁТЧИК ДОСТИЖЕНИЙ В DOM
   ========================================================= */

export function updateProfileAchievementsCount(
    root,
    profile = {}
) {
    if (!root) {
        return
    }

    const counter =
        root.querySelector(
            "[data-profile-achievements-count]"
        )

    if (!counter) {
        return
    }

    const earned =
        normalizeProfileNumber(
            profile.achievements_earned_count
        )

    const total =
        normalizeProfileNumber(
            profile.achievements_total_count
        )

    counter.textContent =
        `${earned}/${total}`
}