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

import {
    RESOURCE_KEYS,
    registerResource,
    peekResource
} from "../core/resourceCache.js"

import {
    t
} from "../../i18n/core/i18n.js"


/* =========================================================
   PROFILE RESOURCE

   Регистрация loader сама по себе
   НЕ делает никакого API-запроса.

   Она нужна только для DataSync,
   когда PROFILE потребуется обновить в фоне.
   ========================================================= */

registerResource(
    RESOURCE_KEYS.PROFILE,
    fetchProfile
)


/* =========================================================
   PROFILE V2
   ========================================================= */


/* =========================================================
   ОТКРЫТЬ ПРОФИЛЬ
   ========================================================= */

export function openProfilePage(
    root
) {
    if (!root) {
        console.error(
            "Profile: не найден корневой контейнер"
        )

        return
    }


    /*
     * События подключаются один раз.
     *
     * initProfileEvents сам защищён WeakSet,
     * поэтому повторных обработчиков не будет.
     */

    initProfileEvents(
        root,
        {
            renderMainPage:
                openProfilePage
        }
    )


    root.dataset.profileView =
        "main"


    /*
     * Никаких API-запросов.
     *
     * Берём PROFILE,
     * который уже загрузил Bootstrap.
     */

    const profile =
        peekResource(
            RESOURCE_KEYS.PROFILE
        )


    if (!profile) {
        console.warn(
            "Profile: PROFILE отсутствует в Resource Cache"
        )

        return
    }


    renderProfileMainPage(
        root,
        profile
    )
}


/* =========================================================
   ГЛАВНАЯ СТРАНИЦА ПРОФИЛЯ
   ========================================================= */

export function renderProfileMainPage(
    root,
    profile = null
) {
    if (!root) {
        return
    }


    root.dataset.profileView =
        "main"


    /*
     * Если profile явно не передали,
     * берём текущий snapshot из Cache.
     */

    const currentProfile =
        profile
        || peekResource(
            RESOURCE_KEYS.PROFILE
        )


    if (!currentProfile) {
        console.warn(
            "Profile: PROFILE отсутствует в Resource Cache"
        )

        return
    }


    root.innerHTML = `
        <section class="profile-page">

            <header class="profile-header">

                <h1 class="profile-header__title">
                    ${t("profile.main.title")}
                </h1>

            </header>


            <div data-profile-user-card-slot>
                ${renderProfileUserCard(
                    currentProfile
                )}
            </div>


            ${renderProfileMenu(
                currentProfile
            )}

        </section>
    `
}