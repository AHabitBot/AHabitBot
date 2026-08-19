import {
    renderProfileStatsPage
} from "./stats/profileStats.js"

import {
    renderProfileAchievementsPage
} from "./achievements/profileAchievements.js"

import {
    renderProfileAppearancePage
} from "./appearance/profileAppearance.js"

import {
    renderProfileSettingsPage
} from "./settings/profileSettings.js"

import {
    renderProfileSupportPage
} from "./support/profileSupport.js"

import {
    renderProfileReferralPage
} from "./referral/profileReferral.js"

import {
    renderProfileArchivePage
} from "./archive/profileArchive.js"

import {
    isProfileFeatureEnabled
} from "./profileFeatures.js"

import {
    openProfileNicknameEditor
} from "./nickname/profileNickname.js"

import {
    updateProfileNickname
} from "./profileApi.js"

import {
    syncAfterNicknameChange
} from "../core/dataSync.js"

import {
    mountBottomNavigation,
    removeBottomNavigation
} from "../navigation.js"


/* =========================================================
   PROFILE V2 — СОБЫТИЯ
   ========================================================= */


const initializedRoots =
    new WeakSet()


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


const PROFILE_PAGES = {
    stats: renderProfileStatsPage,
    achievements: renderProfileAchievementsPage,
    appearance: renderProfileAppearancePage,
    settings: renderProfileSettingsPage,
    support: renderProfileSupportPage,
    referral: renderProfileReferralPage,
    archive: renderProfileArchivePage
}


/* =========================================================
   ИНИЦИАЛИЗИРОВАТЬ СОБЫТИЯ
   ========================================================= */

export function initProfileEvents(
    root,
    {
        renderMainPage
    } = {}
) {
    if (!root) {
        return
    }

    if (
        initializedRoots.has(root)
    ) {
        return
    }

    root.addEventListener(
        "click",
        (event) => {
            handleProfileClick(
                event,
                root,
                renderMainPage
            )
        }
    )

    initializedRoots.add(root)
}


/* =========================================================
   ОБРАБОТАТЬ НАЖАТИЕ
   ========================================================= */

function handleProfileClick(
    event,
    root,
    renderMainPage
) {

    /* -----------------------------------------------------
       РЕДАКТИРОВАНИЕ NICKNAME

       После успешного изменения:
       - сервер сохраняет nickname;
       - Profile обновляется в Cache;
       - Global Leaderboard обновляется в Cache;
       - Season Leaderboard обновляется в Cache;

       Текущая открытая страница профиля
       НЕ перерисовывается.
       ----------------------------------------------------- */

    const nicknameEditButton =
        event.target.closest(
            "[data-profile-edit-nickname]"
        )


    if (nicknameEditButton) {
        const nicknameElement =
            root.querySelector(
                ".profile-user-card__name"
            )


        const currentNickname =
            nicknameElement
                ?.textContent
                ?.trim()
                || ""


        openProfileNicknameEditor({
            currentNickname,

            onConfirm:
                async (
                    nickname
                ) => {

                    /*
                     * Сначала обязательно
                     * сохраняем изменение
                     * на сервере.
                     */

                    await updateProfileNickname(
                        nickname
                    )


                    /*
                     * Затем в фоне обновляем
                     * зависимые Resource Cache.
                     *
                     * await здесь специально
                     * НЕ используется.
                     *
                     * Пользователь не ждёт
                     * Profile / Leaderboard.
                     *
                     * Открытая страница
                     * не перерисовывается.
                     */

                    void syncAfterNicknameChange()
                }
        })


        return
    }


    /* -----------------------------------------------------
       ОТКРЫТИЕ ВНУТРЕННЕГО РАЗДЕЛА
       ----------------------------------------------------- */

    const pageButton =
        event.target.closest(
            "[data-profile-page]"
        )


    if (pageButton) {
        const page =
            pageButton.dataset.profilePage


        if (
            !isProfileFeatureEnabled(
                page
            )
            && !isProfileDeveloper()
        ) {
            showProfileDevelopmentMessage()

            return
        }


        openProfileSection(
            root,
            page
        )


        return
    }


    /* -----------------------------------------------------
       ВОЗВРАТ НАЗАД
       ----------------------------------------------------- */

    const backButton =
        event.target.closest(
            "[data-profile-back]"
        )


    if (
        backButton &&
        typeof renderMainPage ===
            "function"
    ) {
        /*
         * Здесь уже будет использован
         * актуальный PROFILE из Cache.
         */

        renderMainPage(
            root
        )


        mountBottomNavigation(
            "profile"
        )
    }
}


/* =========================================================
   ОТКРЫТЬ РАЗДЕЛ
   ========================================================= */

function openProfileSection(
    root,
    page
) {
    const renderer =
        PROFILE_PAGES[page]


    if (
        typeof renderer !==
        "function"
    ) {
        console.warn(
            `Profile: неизвестный раздел "${page}"`
        )

        return
    }


    /*
     * Внутренние страницы профиля
     * работают без основной нижней
     * навигации приложения.
     */

    removeBottomNavigation()


    /*
     * Запоминаем текущий раздел профиля.
     */

    root.dataset.profileView =
        `section:${page}`


    /*
     * Renderer страницы получает данные
     * из уже подготовленного состояния.
     */

    renderer(
        root
    )
}


/* =========================================================
   РАЗДЕЛ В РАЗРАБОТКЕ
   ========================================================= */

function showProfileDevelopmentMessage() {
    const message =
        "Раздел пока ещё находится на этапе разработки"


    const telegramWebApp =
        window.Telegram?.WebApp


    if (
        telegramWebApp &&
        typeof telegramWebApp.showAlert ===
            "function"
    ) {
        telegramWebApp.showAlert(
            message
        )

        return
    }


    window.alert(
        message
    )
}