import { t } from "../../../i18n/core/i18n.js";

import {
    renderProfileSectionHeader,
    renderProfileUserCard
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
    DEFAULT_PROFILE_AVATAR_ID,
    getProfileAvatar,
    getProfileAvatarsForUser,
    isProfileAvatarVisibleForUser,
    isProfileAvatarUnlocked
} from "./profileAppearanceAvatar.js"

import {
    PROFILE_BACKGROUNDS,
    DEFAULT_PROFILE_BACKGROUND_ID,
    getProfileBackground
} from "./profileAppearanceBackground.js"

import {
    PROFILE_FRAMES,
    DEFAULT_PROFILE_FRAME_ID,
    getProfileFrame
} from "./profileAppearanceFrame.js"


/* =========================================================
   PROFILE APPEARANCE — STATE
   ========================================================= */

let activeAppearanceTab =
    "avatar"


/* =========================================================
   ПРИМЕНЁННЫЕ ЗНАЧЕНИЯ
   ========================================================= */

let appliedAvatarId =
    DEFAULT_PROFILE_AVATAR_ID

let appliedBackgroundId =
    DEFAULT_PROFILE_BACKGROUND_ID

let appliedFrameId =
    DEFAULT_PROFILE_FRAME_ID


/* =========================================================
   PREVIEW
   ========================================================= */

let previewAvatarId =
    DEFAULT_PROFILE_AVATAR_ID

let previewBackgroundId =
    DEFAULT_PROFILE_BACKGROUND_ID

let previewFrameId =
    DEFAULT_PROFILE_FRAME_ID


/* =========================================================
   CURRENT USER
   ========================================================= */

let currentUserLevel =
    1

let currentUserId =
    null

let currentProfile =
    null


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


    if (
        activeAppearanceTab ===
        "frame"
    ) {
        return {
            type: "frame",
            options: PROFILE_FRAMES,
            previewId: previewFrameId,
            appliedId: appliedFrameId
        }
    }


    return {
        type: "avatar",

        /*
         * Для avatar показываем уже
         * отфильтрованный список.
         */
        options:
            getProfileAvatarsForUser(
                currentUserId
            ),

        previewId:
            previewAvatarId,

        appliedId:
            appliedAvatarId
    }
}


/* =========================================================
   ПОЛУЧИТЬ ВНЕШНИЙ ВИД ИЗ CACHE
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


    currentProfile =
        profile


    /* =====================================================
       USER ID
       ===================================================== */

    currentUserId =
        Number(
            profile.user_id
        ) || null


    /* =====================================================
       LEVEL
       ===================================================== */

    currentUserLevel =
        Math.max(
            1,
            Number(
                profile.highest_level_reached
                ?? profile.level
            ) || 1
        )


    /* =====================================================
       AVATAR
       ===================================================== */

    const avatar =
        getProfileAvatar(
            profile.avatar_key
        )


    /* =====================================================
       BACKGROUND
       ===================================================== */

    const background =
        getProfileBackground(
            profile.background_key
        )


    /* =====================================================
       FRAME
       Пока backend не хранит frame_key, используется
       единственная рамка по умолчанию.
       ===================================================== */

    const frame =
        getProfileFrame(
            profile.frame_key
        )


    /*
     * Сохранённый private avatar
     * принимаем только если пользователь
     * действительно имеет к нему доступ.
     */

    const visibleAvatar =
        (
            avatar
            &&
            isProfileAvatarVisibleForUser(
                avatar,
                currentUserId
            )
        )
            ? avatar
            : getProfileAvatar(
                DEFAULT_PROFILE_AVATAR_ID
            )


    appliedAvatarId =
        visibleAvatar
            ? visibleAvatar.id
            : DEFAULT_PROFILE_AVATAR_ID


    appliedBackgroundId =
        background
            ? background.id
            : DEFAULT_PROFILE_BACKGROUND_ID



    appliedFrameId =
        frame
            ? frame.id
            : DEFAULT_PROFILE_FRAME_ID


    /*
     * При открытии страницы preview
     * начинается с реально применённого
     * внешнего вида.
     */

    previewAvatarId =
        appliedAvatarId


    previewBackgroundId =
        appliedBackgroundId



    previewFrameId =
        appliedFrameId
}


/* =========================================================
   PROFILE CARD PREVIEW
   Используем тот же компонент, что и на главной профиля.
   Отличается только mode=appearance: карточка не открывает
   «Внешний вид» повторно; редактирование ника доступно здесь.
   ========================================================= */

function getAppearancePreviewProfile() {
    return {
        ...(currentProfile || {}),
        avatar_key: previewAvatarId,
        background_key: previewBackgroundId,
        frame_key: previewFrameId
    }
}


function renderProfileAppearancePreview() {
    return `
        <div data-profile-appearance-card-slot>
            ${renderProfileUserCard(
                getAppearancePreviewProfile(),
                { mode: "appearance" }
            )}
        </div>
    `
}


function updateProfileAppearancePreview(root) {
    const slot =
        root.querySelector(
            "[data-profile-appearance-card-slot]"
        )

    if (!slot) {
        return
    }

    slot.innerHTML =
        renderProfileUserCard(
            getAppearancePreviewProfile(),
            { mode: "appearance" }
        )
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
                        activeAppearanceTab ===
                        "avatar"
                            ? "is-active"
                            : ""
                    }
                "
                type="button"
                data-appearance-tab="avatar"
            >
                ${t(
                    "profile.appearance.tabs.avatar"
                )}
            </button>


            <button
                class="
                    profile-appearance-tabs__item
                    ${
                        activeAppearanceTab ===
                        "background"
                            ? "is-active"
                            : ""
                    }
                "
                type="button"
                data-appearance-tab="background"
            >
                ${t(
                    "profile.appearance.tabs.background"
                )}
            </button>


            <button
                class="
                    profile-appearance-tabs__item
                    ${
                        activeAppearanceTab ===
                        "frame"
                            ? "is-active"
                            : ""
                    }
                "
                type="button"
                data-appearance-tab="frame"
            >
                ${t(
                    "profile.appearance.tabs.frame"
                )}
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
        &&
        !isProfileAvatarUnlocked(
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
                ${
                    isPreview
                        ? "is-selected"
                        : ""
                }
                ${
                    isLocked
                        ? "is-locked"
                        : ""
                }
                ${
                    type === "frame"
                        ? "is-frame-option"
                        : ""
                }
            "
            type="button"
            data-appearance-option="${option.id}"
            data-appearance-type="${type}"
            data-appearance-locked="${String(
                isLocked
            )}"
            aria-pressed="${String(
                isPreview
            )}"
            aria-disabled="${String(
                isLocked
            )}"
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
                                    level:
                                        requiredLevel
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

            ${
                options
                    .map(
                        option =>
                            renderAppearanceOption({
                                option,
                                type,
                                previewId,
                                appliedId
                            })
                    )
                    .join("")
            }

        </div>
    `
}


/* =========================================================
   ОБНОВИТЬ OPTIONS
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
   СИНХРОНИЗИРОВАТЬ OPTIONS
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
                ${t(
                    "profile.appearance.apply"
                )}
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
                ${
                    renderProfileSectionHeader(
                        t(
                            "profile.appearance.title"
                        )
                    )
                }
            </div>


            ${renderProfileAppearancePreview()}


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


        /*
         * Private avatar нельзя выбрать,
         * даже если вручную подменить DOM.
         */

        if (
            !isProfileAvatarVisibleForUser(
                avatar,
                currentUserId
            )
        ) {
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


    if (
        type === "frame"
    ) {
        const frame =
            getProfileFrame(
                optionId
            )

        if (!frame) {
            return false
        }

        previewFrameId =
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
    root.onclick =
        async (event) => {

            /* ---------------------------------------------
               TAB
               --------------------------------------------- */

            const tabButton =
                event.target.closest(
                    "[data-appearance-tab]"
                )


            if (tabButton) {
                const tab =
                    tabButton.dataset
                        .appearanceTab


                if (
                    tab !== "avatar"
                    &&
                    tab !== "background"
                    &&
                    tab !== "frame"
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
                            button
                                .classList
                                .toggle(
                                    "is-active",
                                    button
                                        .dataset
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


            /* ---------------------------------------------
               OPTION
               --------------------------------------------- */

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


                updateProfileAppearancePreview(
                    root
                )


                syncProfileAppearanceOptions(
                    root
                )


                return
            }


            /* ---------------------------------------------
               APPLY
               --------------------------------------------- */

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
                 * Сохранилось на backend —
                 * теперь считаем применённым.
                 */

                appliedAvatarId =
                    result.avatar_key


                appliedBackgroundId =
                    result.background_key


                syncProfileAppearanceOptions(
                    root
                )


                /*
                 * PROFILE + leaderboard cache.
                 */

                void syncAfterAppearanceChange()
            }

            catch (error) {
                console.error(
                    "Profile appearance save error:",
                    error
                )


                window.alert(
                    error?.message
                    ||
                    t(
                        "profile.appearance.error.saveGeneric"
                    )
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