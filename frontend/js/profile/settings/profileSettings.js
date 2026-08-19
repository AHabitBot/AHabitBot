import {
    renderProfileSectionHeader
} from "../profileComponents.js";

import {
    fetchProfileSettings,
    updateRemindersEnabled
} from "./profileSettingsApi.js";

import {
    renderProfileTimezonePage
} from "./profileTimezone.js";

import {
    renderProfileThemePage
} from "./profileTheme.js";


/* =========================================================
   PROFILE SETTINGS

   MVP:
   - Напоминания — работают
   - Часовой пояс — работает
   - Язык — заглушка
   - Тема — работает
   ========================================================= */


/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */

let currentSettings = null;

let remindersRequestInProgress =
    false;


/* =========================================================
   СТРОКА — НАПОМИНАНИЯ
   ========================================================= */

function renderRemindersRow({
    enabled = false
} = {}) {
    return `
        <div class="profile-settings-row">

            <div
                class="
                    profile-settings-row__icon
                    profile-settings-row__icon--reminders
                "
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    notifications
                </span>
            </div>


            <div class="profile-settings-row__content">

                <div class="profile-settings-row__title">
                    Напоминания
                </div>

                <div class="profile-settings-row__description">
                    Уведомления от бота в 20:00
                </div>

            </div>


            <button
                type="button"
                class="
                    profile-settings-toggle
                    ${enabled ? "is-enabled" : ""}
                "
                data-settings-reminders-toggle
                aria-label="${
                    enabled
                        ? "Выключить напоминания"
                        : "Включить напоминания"
                }"
                aria-pressed="${String(enabled)}"
            >
                <span
                    class="profile-settings-toggle__thumb"
                ></span>
            </button>

        </div>
    `;
}


/* =========================================================
   СТРОКА — ЯЗЫК
   ========================================================= */

function renderLanguageRow() {
    return `
        <button
            type="button"
            class="
                profile-settings-row
                profile-settings-row--button
            "
            data-settings-placeholder="language"
        >

            <div
                class="
                    profile-settings-row__icon
                    profile-settings-row__icon--language
                "
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    language
                </span>
            </div>


            <div class="profile-settings-row__content">

                <div class="profile-settings-row__title">
                    Язык
                </div>

                <div class="profile-settings-row__description">
                    Язык интерфейса
                </div>

            </div>


            <div class="profile-settings-row__right">

                <span class="profile-settings-row__value">
                    Русский
                </span>

                <span
                    class="
                        material-symbols-rounded
                        profile-settings-row__chevron
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>

            </div>

        </button>
    `;
}


/* =========================================================
   СТРОКА — ЧАСОВОЙ ПОЯС
   ========================================================= */

function renderTimezoneRow(
    timezone = "Europe/Kyiv"
) {
    return `
        <button
            type="button"
            class="
                profile-settings-row
                profile-settings-row--button
            "
            data-settings-timezone
        >

            <div
                class="
                    profile-settings-row__icon
                    profile-settings-row__icon--timezone
                "
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    schedule
                </span>
            </div>


            <div class="profile-settings-row__content">

                <div class="profile-settings-row__title">
                    Часовой пояс
                </div>

                <div class="profile-settings-row__description">
                    Для расчёта дня и напоминаний
                </div>

            </div>


            <div class="profile-settings-row__right">

                <span class="profile-settings-row__value">
                    ${timezone}
                </span>

                <span
                    class="
                        material-symbols-rounded
                        profile-settings-row__chevron
                    "
                    aria-hidden="true"
                >
                    chevron_right
                </span>

            </div>

        </button>
    `;
}


/* =========================================================
   СТРОКА — ТЕМА
   ========================================================= */

function renderThemeRow(
    theme = "light"
) {
    const isDark = theme === "dark";

    return `
        <button
            type="button"
            class="
                profile-settings-row
                profile-settings-row--button
            "
            data-settings-theme
        >

            <div
                class="
                    profile-settings-row__icon
                    profile-settings-row__icon--theme
                "
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    ${isDark ? "dark_mode" : "light_mode"}
                </span>
            </div>

            <div class="profile-settings-row__content">
                <div class="profile-settings-row__title">Тема</div>
                <div class="profile-settings-row__description">Оформление приложения</div>
            </div>

            <div class="profile-settings-row__right">
                <span class="profile-settings-row__value">
                    ${isDark ? "Тёмная" : "Светлая"}
                </span>
                <span class="material-symbols-rounded profile-settings-row__chevron" aria-hidden="true">
                    chevron_right
                </span>
            </div>
        </button>
    `;
}


/* =========================================================
   ОСНОВНАЯ РАЗМЕТКА
   ========================================================= */

function renderSettingsContent(
    root,
    {
        remindersEnabled = false,
        timezone = "Europe/Kyiv",
        theme = "light",
    } = {}
) {
    root.innerHTML = `
        <section class="profile-settings-page">

            ${renderProfileSectionHeader(
                "Настройки"
            )}


            <main class="profile-settings-body">

                <div class="profile-settings-card">

                    ${renderRemindersRow({
                        enabled:
                            remindersEnabled
                    })}


                    <div
                        class="profile-settings-divider"
                    ></div>


                    ${renderLanguageRow()}


                    <div
                        class="profile-settings-divider"
                    ></div>


                    ${renderTimezoneRow(
                        timezone
                    )}


                    <div
                        class="profile-settings-divider"
                    ></div>


                    ${renderThemeRow(
                        theme
                    )}

                </div>

            </main>

        </section>
    `;
}


/* =========================================================
   ОБНОВИТЬ ТОЛЬКО TOGGLE
   ========================================================= */

function updateRemindersToggle(
    root,
    enabled
) {
    const toggle =
        root.querySelector(
            "[data-settings-reminders-toggle]"
        );


    if (!toggle) {
        return;
    }


    toggle.classList.toggle(
        "is-enabled",
        enabled
    );


    toggle.setAttribute(
        "aria-pressed",
        String(enabled)
    );


    toggle.setAttribute(
        "aria-label",
        enabled
            ? "Выключить напоминания"
            : "Включить напоминания"
    );
}


/* =========================================================
   ПЕРЕРИСОВАТЬ ОСНОВНЫЕ НАСТРОЙКИ
   ========================================================= */

function renderCurrentSettings(
    root
) {
    renderSettingsContent(
        root,
        {
            remindersEnabled:
                Boolean(
                    currentSettings
                        ?.reminders_enabled
                ),

            timezone:
                currentSettings
                    ?.timezone ||
                "Europe/Kyiv",

            theme:
                currentSettings
                    ?.theme ||
                "light",
        }
    );


    initSettingsEvents(
        root
    );
}


/* =========================================================
   ОТКРЫТЬ TIMEZONE
   ========================================================= */

function openTimezoneSettings(
    root
) {
    renderProfileTimezonePage(
        root,
        {
            currentTimezone:
                currentSettings
                    ?.timezone ||
                "Europe/Kyiv",


            /* ---------------------------------------------
               TIMEZONE УСПЕШНО СОХРАНЁН
               --------------------------------------------- */

            onTimezoneChanged:
                (
                    settings
                ) => {

                    currentSettings =
                        settings;
                },


            /* ---------------------------------------------
               ВОЗВРАТ В НАСТРОЙКИ
               --------------------------------------------- */

            onBack:
                () => {

                    renderCurrentSettings(
                        root
                    );
                },
        }
    );
}


/* =========================================================
   ОТКРЫТЬ ТЕМУ
   ========================================================= */

function openThemeSettings(
    root
) {
    renderProfileThemePage(
        root,
        {
            currentTheme:
                currentSettings
                    ?.theme ||
                "light",

            onThemeChanged:
                (settings) => {
                    currentSettings = settings;
                },

            onBack:
                () => {
                    renderCurrentSettings(root);
                },
        }
    );
}


/* =========================================================
   СОБЫТИЯ
   ========================================================= */

function initSettingsEvents(
    root
) {

    /* =====================================================
       НАПОМИНАНИЯ
       ===================================================== */

    const remindersToggle =
        root.querySelector(
            "[data-settings-reminders-toggle]"
        );


    if (remindersToggle) {

        remindersToggle.addEventListener(
            "click",
            async () => {

                if (
                    remindersRequestInProgress
                ) {
                    return;
                }


                const previousValue =
                    Boolean(
                        currentSettings
                            ?.reminders_enabled
                    );


                const nextValue =
                    !previousValue;


                remindersRequestInProgress =
                    true;


                remindersToggle.disabled =
                    true;


                /*
                 * Оптимистично показываем
                 * новое состояние.
                 */

                updateRemindersToggle(
                    root,
                    nextValue
                );


                try {

                    const settings =
                        await updateRemindersEnabled(
                            nextValue
                        );


                    currentSettings =
                        settings;


                    updateRemindersToggle(
                        root,
                        Boolean(
                            settings
                                .reminders_enabled
                        )
                    );

                } catch (error) {

                    console.error(
                        "Не удалось изменить напоминания:",
                        error
                    );


                    /*
                     * Если сервер не сохранил —
                     * возвращаем старое состояние.
                     */

                    updateRemindersToggle(
                        root,
                        previousValue
                    );

                } finally {

                    remindersRequestInProgress =
                        false;


                    if (
                        document.contains(
                            remindersToggle
                        )
                    ) {
                        remindersToggle.disabled =
                            false;
                    }
                }
            }
        );
    }


    /* =====================================================
       ЧАСОВОЙ ПОЯС
       ===================================================== */

    const timezoneButton =
        root.querySelector(
            "[data-settings-timezone]"
        );


    if (timezoneButton) {

        timezoneButton.addEventListener(
            "click",
            () => {

                openTimezoneSettings(
                    root
                );
            }
        );
    }


    /* =====================================================
       ТЕМА
       ===================================================== */

    const themeButton =
        root.querySelector(
            "[data-settings-theme]"
        );

    if (themeButton) {
        themeButton.addEventListener(
            "click",
            () => {
                openThemeSettings(root);
            }
        );
    }


    /* =====================================================
       ЗАГЛУШКИ
       ===================================================== */

    root
        .querySelectorAll(
            "[data-settings-placeholder]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        console.log(
                            "Настройка пока в разработке:",
                            button.dataset
                                .settingsPlaceholder
                        );
                    }
                );
            }
        );
}


/* =========================================================
   ОТКРЫТЬ СТРАНИЦУ НАСТРОЕК
   ========================================================= */

export async function renderProfileSettingsPage(
    root
) {
    if (!root) {
        console.error(
            "Profile Settings: root не передан"
        );

        return;
    }


    /*
     * Сначала рисуем страницу
     * без ожидания GET.
     */

    renderSettingsContent(
        root,
        {
            remindersEnabled:
                false,

            timezone:
                "Europe/Kyiv",

            theme:
                "light",
        }
    );


    try {

        const settings =
            await fetchProfileSettings();


        currentSettings =
            settings;


        /*
         * Теперь рисуем реальные значения
         * из PostgreSQL.
         */

        renderCurrentSettings(
            root
        );

    } catch (error) {

        console.error(
            "Не удалось загрузить настройки:",
            error
        );


        /*
         * Если GET упал —
         * страницу оставляем,
         * но рабочие действия отключаем.
         */

        const toggle =
            root.querySelector(
                "[data-settings-reminders-toggle]"
            );


        const timezoneButton =
            root.querySelector(
                "[data-settings-timezone]"
            );


        if (toggle) {
            toggle.disabled =
                true;
        }


        if (timezoneButton) {
            timezoneButton.disabled =
                true;
        }
    }
}