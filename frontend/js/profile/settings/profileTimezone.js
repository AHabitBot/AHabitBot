import {
    renderProfileSectionHeader
} from "../profileComponents.js";

import {
    updateTimezone
} from "./profileSettingsApi.js";


/* =========================================================
   PROFILE TIMEZONE

   MVP список:
   - Берлин
   - Варшава
   - Киев
   - Москва
   - Осло
   - Нью-Йорк
   ========================================================= */


const TIMEZONE_OPTIONS = [
    {
        label: "Берлин",
        value: "Europe/Berlin",
    },
    {
        label: "Варшава",
        value: "Europe/Warsaw",
    },
    {
        label: "Киев",
        value: "Europe/Kyiv",
    },
    {
        label: "Москва",
        value: "Europe/Moscow",
    },
    {
        label: "Осло",
        value: "Europe/Oslo",
    },
    {
        label: "Нью-Йорк",
        value: "America/New_York",
    },
];


/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */

let timezoneRequestInProgress =
    false;


/* =========================================================
   ОДНА СТРОКА TIMEZONE
   ========================================================= */

function renderTimezoneOption(
    option,
    currentTimezone
) {
    const isSelected =
        option.value ===
        currentTimezone;

    return `
        <button
            type="button"
            class="
                profile-timezone-option
                ${isSelected ? "is-selected" : ""}
            "
            data-timezone-value="${option.value}"
        >

            <div class="profile-timezone-option__content">

                <div class="profile-timezone-option__label">
                    ${option.label}
                </div>

                <div class="profile-timezone-option__value">
                    ${option.value}
                </div>

            </div>


            <div class="profile-timezone-option__status">

                ${
                    isSelected
                        ? `
                            <span
                                class="
                                    material-symbols-rounded
                                    profile-timezone-option__check
                                "
                                aria-hidden="true"
                            >
                                check_circle
                            </span>
                        `
                        : `
                            <span
                                class="
                                    profile-timezone-option__circle
                                "
                                aria-hidden="true"
                            ></span>
                        `
                }

            </div>

        </button>
    `;
}


/* =========================================================
   СПИСОК
   ========================================================= */

function renderTimezoneList(
    currentTimezone
) {
    return `
        <div class="profile-timezone-list">

            ${
                TIMEZONE_OPTIONS
                    .map(
                        (option) =>
                            renderTimezoneOption(
                                option,
                                currentTimezone
                            )
                    )
                    .join("")
            }

        </div>
    `;
}


/* =========================================================
   ПЕРЕРИСОВАТЬ ТОЛЬКО ВЫБОР
   ========================================================= */

function refreshTimezoneSelection(
    root,
    currentTimezone
) {
    const list =
        root.querySelector(
            ".profile-timezone-list"
        );

    if (!list) {
        return;
    }

    list.innerHTML =
        TIMEZONE_OPTIONS
            .map(
                (option) =>
                    renderTimezoneOption(
                        option,
                        currentTimezone
                    )
            )
            .join("");
}


/* =========================================================
   СОБЫТИЯ
   ========================================================= */

function initTimezoneEvents(
    root,
    {
        currentTimezone,
        onTimezoneChanged,
        onBack,
    }
) {
    const page =
        root.querySelector(
            ".profile-timezone-page"
        );


    if (!page) {
        console.warn(
            "Profile Timezone: страница timezone не найдена"
        );

        return;
    }


    page.addEventListener(
        "click",
        async (event) => {

            /* =============================================
               НАЗАД
               ============================================= */

            const backButton =
                event.target.closest(
                    "[data-profile-back]"
                );


            if (backButton) {

                /*
                 * Эта стрелка принадлежит
                 * только подэкрану Timezone.
                 *
                 * Не даём общему profileEvents
                 * вернуть пользователя сразу
                 * в главный Профиль.
                 */

                event.stopPropagation();


                if (
                    typeof onBack ===
                    "function"
                ) {
                    onBack();
                }


                return;
            }


            /* =============================================
               ВЫБОР TIMEZONE
               ============================================= */

            const optionButton =
                event.target.closest(
                    "[data-timezone-value]"
                );


            if (!optionButton) {
                return;
            }


            if (
                timezoneRequestInProgress
            ) {
                return;
            }


            const timezone =
                optionButton.dataset
                    .timezoneValue;


            if (!timezone) {
                return;
            }


            if (
                timezone ===
                currentTimezone
            ) {
                return;
            }


            timezoneRequestInProgress =
                true;


            const buttons =
                page.querySelectorAll(
                    "[data-timezone-value]"
                );


            buttons.forEach(
                (button) => {
                    button.disabled =
                        true;
                }
            );


            try {

                const settings =
                    await updateTimezone(
                        timezone
                    );


                const savedTimezone =
                    settings.timezone;


                refreshTimezoneSelection(
                    root,
                    savedTimezone
                );


                if (
                    typeof onTimezoneChanged ===
                    "function"
                ) {
                    onTimezoneChanged(
                        settings
                    );
                }


                /*
                 * После успешного выбора
                 * возвращаемся в Настройки.
                 */

                if (
                    typeof onBack ===
                    "function"
                ) {
                    onBack();
                }


            } catch (error) {

                console.error(
                    "Не удалось изменить часовой пояс:",
                    error
                );


                /*
                 * Если страница всё ещё существует,
                 * возвращаем кнопки в активное состояние.
                 */

                if (
                    document.contains(
                        page
                    )
                ) {
                    buttons.forEach(
                        (button) => {
                            button.disabled =
                                false;
                        }
                    );
                }


            } finally {

                timezoneRequestInProgress =
                    false;
            }
        }
    );
}

/* =========================================================
   ОТКРЫТЬ СТРАНИЦУ TIMEZONE
   ========================================================= */

export function renderProfileTimezonePage(
    root,
    {
        currentTimezone = "Europe/Kyiv",
        onTimezoneChanged = null,
        onBack = null,
    } = {}
) {
    if (!root) {
        console.error(
            "Profile Timezone: root не передан"
        );

        return;
    }


    root.innerHTML = `
        <section class="profile-timezone-page">

            ${renderProfileSectionHeader(
                "Часовой пояс"
            )}


            <main class="profile-timezone-body">

                <div class="profile-timezone-card">

                    ${renderTimezoneList(
                        currentTimezone
                    )}

                </div>

            </main>

        </section>
    `;


    initTimezoneEvents(
        root,
        {
            currentTimezone,
            onTimezoneChanged,
            onBack,
        }
    );
}