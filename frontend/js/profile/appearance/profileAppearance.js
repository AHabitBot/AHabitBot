import { t } from "../../../i18n/core/i18n.js";

import {
    renderProfileSectionHeader
} from "../profileComponents.js"

import {
    updateProfileAppearance
} from "../profileApi.js"

import {
    RESOURCE_KEYS,
    peekResource
} from "../../core/resourceCache.js"

import {
    syncAfterAppearanceChange
} from "../../core/dataSync.js"

import {
    PROFILE_AVATARS,
    DEFAULT_PROFILE_AVATAR_ID,
    getProfileAvatar,
    isProfileAvatarUnlocked
} from "./profileAppearanceAvatar.js"

import {
    PROFILE_BACKGROUNDS,
    DEFAULT_PROFILE_BACKGROUND_ID,
    getProfileBackground
} from "./profileAppearanceBackground.js"


/* =========================================================
   PROFILE APPEARANCE — STATE
   ========================================================= */

let activeAppearanceTab =
    "avatar"


/* =========================================================
   ПРИМЕНЁННЫЕ ЗНАЧЕНИЯ

   Это то, что реально сохранено в БД.
   Именно на этих вариантах показываем галочку.
   ========================================================= */

let appliedAvatarId =
    DEFAULT_PROFILE_AVATAR_ID

let appliedBackgroundId =
    DEFAULT_PROFILE_BACKGROUND_ID


/* =========================================================
   PREVIEW

   Это то, что пользователь сейчас просматривает.
   На этих вариантах показываем зелёную рамку.

   До нажатия «Применить»
   значения в БД не меняются.
   ========================================================= */

let previewAvatarId =
    DEFAULT_PROFILE_AVATAR_ID

let previewBackgroundId =
    DEFAULT_PROFILE_BACKGROUND_ID


let currentUserLevel =
    1


/* =========================================================
   ПОЛУЧИТЬ ДАННЫЕ АКТИВНОЙ ВКЛАДКИ
   ========================================================= */

function getActiveAppearanceOptions() {
    if (
        activeAppearanceTab ===
        "background"
    ) {
        return {
            type: "background",

            options:
                PROFILE_BACKGROUNDS,

            previewId:
                previewBackgroundId,

            appliedId:
                appliedBackgroundId
        }
    }

    return {
        type: "avatar",

        options:
            PROFILE_AVATARS,

        previewId:
            previewAvatarId,

        appliedId:
            appliedAvatarId
    }
}


/* =========================================================
   ПОЛУЧИТЬ ВНЕШНИЙ ВИД ИЗ CACHE

   ВАЖНО:
   Profile уже загружен Bootstrap'ом.
   Здесь никаких API-запросов нет.
   ========================================================= */

function loadProfileAppearance() {
    const profile =
        peekResource(
            RESOURCE_KEYS.PROFILE
        )


    if (!profile) {
        throw new Error(
            "Profile отсутствует в Resource Cache"
        )
    }


    currentUserLevel =
        Math.max(
            1,
            Number(
                profile.highest_level_reached
                ?? profile.level
            ) || 1
        )


    const avatar =
        getProfileAvatar(
            profile.avatar_key
        )


    const background =
        getProfileBackground(
            profile.background_key
        )


    appliedAvatarId =
        avatar
            ? avatar.id
            : DEFAULT_PROFILE_AVATAR_ID


    appliedBackgroundId =
        background
            ? background.id
            : DEFAULT_PROFILE_BACKGROUND_ID


    /*
     * При каждом новом открытии страницы
     * preview начинается с реально
     * применённого внешнего вида.
     */

    previewAvatarId =
        appliedAvatarId


    previewBackgroundId =
        appliedBackgroundId
}


/* =========================================================
   HERO
   ========================================================= */

function renderProfileAppearanceHero() {
    const avatar =
        getProfileAvatar(
            previewAvatarId
        )

    const background =
        getProfileBackground(
            previewBackgroundId
        )

    return `
        <section
            class="profile-appearance-hero"
            aria-label="${t("profile.appearance.previewAria")}"
        >

            <img
                class="profile-appearance-hero__background"
                src="${background?.image || ""}"
                alt=""
                aria-hidden="true"
            >

            <div
                class="profile-appearance-hero__fade"
                aria-hidden="true"
            ></div>

            <div
                class="profile-appearance-hero__avatar-wrap"
            >

                <img
                    class="profile-appearance-hero__avatar"
                    src="${avatar?.image || ""}"
                    alt="${t("profile.appearance.characterAlt")}"
                >

            </div>

        </section>
    `
}


/* =========================================================
   ОБНОВИТЬ HERO БЕЗ ПЕРЕРИСОВКИ СТРАНИЦЫ
   ========================================================= */

function updateProfileAppearanceHero(
    root
) {
    const avatar =
        getProfileAvatar(
            previewAvatarId
        )

    const background =
        getProfileBackground(
            previewBackgroundId
        )


    const avatarImage =
        root.querySelector(
            ".profile-appearance-hero__avatar"
        )

    const backgroundImage =
        root.querySelector(
            ".profile-appearance-hero__background"
        )


    if (
        avatarImage &&
        avatar?.image &&
        avatarImage.src !==
            new URL(
                avatar.image,
                window.location.href
            ).href
    ) {
        avatarImage.src =
            avatar.image
    }


    if (
        backgroundImage &&
        background?.image &&
        backgroundImage.src !==
            new URL(
                background.image,
                window.location.href
            ).href
    ) {
        backgroundImage.src =
            background.image
    }
}


/* =========================================================
   TABS
   ========================================================= */

function renderProfileAppearanceTabs() {
    return `
        <div class="profile-appearance-tabs">

            <button
                class="
                    profile-appearance-tabs__item
                    ${
                        activeAppearanceTab === "avatar"
                            ? "is-active"
                            : ""
                    }
                "
                type="button"
                data-appearance-tab="avatar"
            >
                ${t("profile.appearance.tabs.avatar")}
            </button>


            <button
                class="
                    profile-appearance-tabs__item
                    ${
                        activeAppearanceTab === "background"
                            ? "is-active"
                            : ""
                    }
                "
                type="button"
                data-appearance-tab="background"
            >
                ${t("profile.appearance.tabs.background")}
            </button>

        </div>
    `
}


/* =========================================================
   ОДИН OPTION
   ========================================================= */

function renderAppearanceOption({
    option,
    type,
    previewId,
    appliedId
}) {
    const isPreview =
        option.id ===
        previewId


    const isApplied =
        option.id ===
        appliedId


    const isLocked =
        type === "avatar"
        && !isProfileAvatarUnlocked(
            option,
            currentUserLevel
        )


    const requiredLevel =
        Math.max(
            1,
            Number(
                option.requiredLevel
            ) || 1
        )


    return `
        <button
            class="
                profile-appearance-option
                ${isPreview ? "is-selected" : ""}
                ${isLocked ? "is-locked" : ""}
            "
            type="button"
            data-appearance-option="${option.id}"
            data-appearance-type="${type}"
            data-appearance-locked="${String(isLocked)}"
            aria-pressed="${String(isPreview)}"
            aria-disabled="${String(isLocked)}"
        >

            <img
                class="profile-appearance-option__image"
                src="${option.image}"
                alt=""
            >


            ${
                isLocked
                    ? `
                        <span
                            class="
                                profile-appearance-option__level
                            "
                        >
                             ${t(
                                 "profile.appearance.locked.level",
                                 {
                                     level: requiredLevel
                                 }
                             )}
                        </span>
                    `
                    : ""
            }


            ${
                isApplied
                    ? `
                        <span
                            class="
                                profile-appearance-option__check
                                material-symbols-rounded
                            "
                            aria-hidden="true"
                        >
                            check
                        </span>
                    `
                    : ""
            }

        </button>
    `
}


/* =========================================================
   OPTIONS
   ========================================================= */

function renderProfileAppearanceOptions() {
    const {
        type,
        options,
        previewId,
        appliedId
    } =
        getActiveAppearanceOptions()


    return `
        <div
            class="profile-appearance-options"
            data-appearance-options="${type}"
        >

            ${options.map(
                option =>
                    renderAppearanceOption({
                        option,
                        type,
                        previewId,
                        appliedId
                    })
            ).join("")}

        </div>
    `
}


/* =========================================================
   ОБНОВИТЬ OPTIONS

   Используется при смене вкладки.
   Hero при этом не перерисовывается.
   ========================================================= */

function updateProfileAppearanceOptions(
    root
) {
    const currentOptions =
        root.querySelector(
            ".profile-appearance-options"
        )

    if (!currentOptions) {
        return
    }

    currentOptions.outerHTML =
        renderProfileAppearanceOptions()
}


/* =========================================================
   ОБНОВИТЬ СОСТОЯНИЕ РАМОК И ГАЛОЧЕК
   БЕЗ ПЕРЕРИСОВКИ СТРАНИЦЫ
   ========================================================= */

function syncProfileAppearanceOptions(
    root
) {
    const {
        type,
        previewId,
        appliedId
    } =
        getActiveAppearanceOptions()


    const buttons =
        root.querySelectorAll(
            `[data-appearance-type="${type}"]`
        )


    buttons.forEach(
        button => {
            const optionId =
                button.dataset
                    .appearanceOption


            const isPreview =
                optionId ===
                previewId


            const isApplied =
                optionId ===
                appliedId


            /*
             * РАМКА = PREVIEW
             */

            button.classList.toggle(
                "is-selected",
                isPreview
            )

            button.setAttribute(
                "aria-pressed",
                String(isPreview)
            )


            /*
             * ГАЛОЧКА = ПРИМЕНЁННЫЙ
             */

            let check =
                button.querySelector(
                    ".profile-appearance-option__check"
                )


            if (isApplied) {
                if (!check) {
                    check =
                        document.createElement(
                            "span"
                        )

                    check.className =
                        "profile-appearance-option__check material-symbols-rounded"

                    check.setAttribute(
                        "aria-hidden",
                        "true"
                    )

                    check.textContent =
                        "check"

                    button.appendChild(
                        check
                    )
                }

                return
            }


            check?.remove()
        }
    )
}


/* =========================================================
   APPLY BUTTON
   ========================================================= */

function renderProfileAppearanceButton() {
    return `
        <div class="profile-appearance-apply">

            <button
                class="profile-appearance-apply__button"
                type="button"
                data-appearance-apply
            >
                ${t("profile.appearance.apply")}
            </button>

        </div>
    `
}


/* =========================================================
   PAGE CONTENT
   ========================================================= */

function renderProfileAppearanceContent(
    root
) {
    root.innerHTML = `
        <section
            class="
                profile-page
                profile-appearance-page
            "
        >

            <div
                class="profile-appearance-header"
            >
                ${renderProfileSectionHeader(
                    t("profile.appearance.title")
                )}
            </div>


            ${renderProfileAppearanceHero()}


            ${renderProfileAppearanceTabs()}


            ${renderProfileAppearanceOptions()}


            ${renderProfileAppearanceButton()}

        </section>
    `
}


/* =========================================================
   SELECT PREVIEW
   ========================================================= */

function selectAppearancePreview(
    type,
    optionId
) {
    if (
        type === "avatar"
    ) {
        const avatar =
            getProfileAvatar(
                optionId
            )


        if (!avatar) {
            return false
        }


        const isUnlocked =
            isProfileAvatarUnlocked(
                avatar,
                currentUserLevel
            )


        if (!isUnlocked) {
            return false
        }


        previewAvatarId =
            optionId


        return true
    }


    if (
        type === "background"
    ) {
        const background =
            getProfileBackground(
                optionId
            )


        if (!background) {
            return false
        }


        previewBackgroundId =
            optionId


        return true
    }


    return false
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindProfileAppearanceEvents(
    root
) {

    /*
     * Используем один обработчик на root.
     *
     * Не пересоздаём всю страницу
     * при каждом выборе.
     */

    root.onclick =
        async (event) => {

            /* -------------------------------------------------
               TAB
               ------------------------------------------------- */

            const tabButton =
                event.target.closest(
                    "[data-appearance-tab]"
                )

            if (tabButton) {
                const tab =
                    tabButton.dataset
                        .appearanceTab

                if (
                    tab !== "avatar" &&
                    tab !== "background"
                ) {
                    return
                }


                if (
                    tab ===
                    activeAppearanceTab
                ) {
                    return
                }


                activeAppearanceTab =
                    tab


                root
                    .querySelectorAll(
                        "[data-appearance-tab]"
                    )
                    .forEach(
                        button => {
                            button.classList.toggle(
                                "is-active",
                                button.dataset
                                    .appearanceTab ===
                                    activeAppearanceTab
                            )
                        }
                    )


                updateProfileAppearanceOptions(
                    root
                )

                return
            }


            /* -------------------------------------------------
               OPTION
               ------------------------------------------------- */

            const optionButton =
                event.target.closest(
                    "[data-appearance-option]"
                )

            if (optionButton) {
                const optionId =
                    optionButton.dataset
                        .appearanceOption

                const type =
                    optionButton.dataset
                        .appearanceType


                if (
                    !optionId ||
                    !type
                ) {
                    return
                }


                const changed =
                    selectAppearancePreview(
                        type,
                        optionId
                    )


                if (!changed) {
                    return
                }


                /*
                 * Меняем только нужные элементы.
                 * Страница не рендерится заново.
                 */

                updateProfileAppearanceHero(
                    root
                )

                syncProfileAppearanceOptions(
                    root
                )

                return
            }


            /* -------------------------------------------------
               APPLY
               ------------------------------------------------- */

            const applyButton =
                event.target.closest(
                    "[data-appearance-apply]"
                )

            if (!applyButton) {
                return
            }


            applyButton.disabled =
                true


            try {
                const result =
                    await updateProfileAppearance({
                        avatarKey:
                            previewAvatarId,

                        backgroundKey:
                            previewBackgroundId
                    })


                /*
                 * Только после успешного ответа API
                 * считаем preview применённым.
                 */

                appliedAvatarId =
                    result.avatar_key

                appliedBackgroundId =
                    result.background_key


                /*
                 * Обновляем только галочку
                 * на текущей странице.
                 */

                syncProfileAppearanceOptions(
                    root
                )


                /*
                 * Тихо обновляем зависимые кэши:
                 *
                 * PROFILE
                 * GLOBAL LEADERBOARD
                 * SEASON LEADERBOARD
                 *
                 * Открытая страница не перерисовывается.
                 */

                void syncAfterAppearanceChange()
            }

            catch (error) {
                console.error(
                    "Profile appearance save error:",
                    error
                )

                window.alert(
                    error?.message ||
                    t("profile.appearance.error.saveGeneric")
                )
            }

            finally {
                applyButton.disabled =
                    false
            }
        }
}


/* =========================================================
   PAGE
   ========================================================= */

export async function renderProfileAppearancePage(
    root
) {
    if (!root) {
        return
    }


    try {
        loadProfileAppearance()
    }

    catch (error) {
        console.error(
            "Profile appearance load error:",
            error
        )
    }


    renderProfileAppearanceContent(
        root
    )


    bindProfileAppearanceEvents(
        root
    )
}