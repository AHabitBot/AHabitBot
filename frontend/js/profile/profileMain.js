import {
    renderProfileUserCard,
    renderProfileMenu
} from "./profileComponents.js"

import {
    initProfileEvents
} from "./profileEvents.js"

import {
    fetchProfile
} from "./profileApi.js"


/* =========================================================
   PROFILE V2 — ГЛАВНАЯ СТРАНИЦА
   ========================================================= */


/* =========================================================
   ОТКРЫТЬ ПРОФИЛЬ
   ========================================================= */

export async function openProfilePage(root) {
    if (!root) {
        console.error(
            "Profile: не найден корневой контейнер"
        )

        return
    }


    initProfileEvents(
        root,
        {
            renderMainPage:
                openProfilePage
        }
    )


    try {
        const profile =
            await fetchProfile()

        renderProfileMainPage(
            root,
            profile
        )
    }

    catch (error) {
        console.error(
            "Profile: ошибка загрузки профиля",
            error
        )

        renderProfileLoadError(root)
    }
}


/* =========================================================
   ГЛАВНАЯ СТРАНИЦА ПРОФИЛЯ
   ========================================================= */

export function renderProfileMainPage(
    root,
    profile
) {
    if (!root) {
        return
    }


    root.innerHTML = `
        <section class="profile-page">

            <header class="profile-header">

                <h1 class="profile-header__title">
                    Профиль
                </h1>

            </header>

            ${renderProfileUserCard(profile)}

            ${renderProfileMenu()}

        </section>
    `
}


/* =========================================================
   ОШИБКА ЗАГРУЗКИ
   ========================================================= */

function renderProfileLoadError(root) {
    root.innerHTML = `
        <section class="profile-page">

            <header class="profile-header">

                <h1 class="profile-header__title">
                    Профиль
                </h1>

            </header>

            <div class="profile-load-error">
                Не удалось загрузить профиль
            </div>

        </section>
    `
}