import {
    renderProfileUserCard,
    renderProfileMenu
} from "./profileComponents.js"

import {
    initProfileEvents
} from "./profileEvents.js"


/* =========================================================
   PROFILE V2 — ГЛАВНАЯ СТРАНИЦА
   ========================================================= */


/* =========================================================
   ОТКРЫТЬ ПРОФИЛЬ
   ========================================================= */

export function openProfilePage(root) {
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
                renderProfileMainPage
        }
    )

    renderProfileMainPage(root)
}


/* =========================================================
   РЕНДЕР ГЛАВНОЙ СТРАНИЦЫ ПРОФИЛЯ
   ========================================================= */

export function renderProfileMainPage(
    root
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

            ${renderProfileUserCard()}

            ${renderProfileMenu()}

        </section>
    `
}