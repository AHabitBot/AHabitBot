import {
    renderProfileSectionHeader
} from "../profileComponents.js";

import {
    fetchProfileSettings,
    updateRemindersEnabled
} from "./profileSettingsApi.js";

import {
    getTimezoneLabel,
    renderProfileTimezonePage
} from "./profileTimezone.js";

import {
    renderProfileThemePage
} from "./profileTheme.js";

import {
    renderProfileLanguagePage
} from "./profileLanguage.js";

import {
    getLanguageLabel,
    normalizeLanguage,
    setLanguage,
    t
} from "../../../i18n/core/i18n.js";


let currentSettings = null;
let remindersRequestInProgress = false;


function renderRemindersRow({ enabled = false } = {}) {
    return `
        <div class="profile-settings-row">
            <div
                class="profile-settings-row__icon profile-settings-row__icon--reminders"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">notifications</span>
            </div>

            <div class="profile-settings-row__content">
                <div class="profile-settings-row__title">
                    ${t("profile.settings.reminders.title")}
                </div>
                <div class="profile-settings-row__description">
                    ${t("profile.settings.reminders.description")}
                </div>
            </div>

            <button
                type="button"
                class="profile-settings-toggle ${enabled ? "is-enabled" : ""}"
                data-settings-reminders-toggle
                aria-label="${enabled
                    ? t("profile.settings.reminders.disable")
                    : t("profile.settings.reminders.enable")}"
                aria-pressed="${String(enabled)}"
            >
                <span class="profile-settings-toggle__thumb"></span>
            </button>
        </div>
    `;
}


function renderLanguageRow(language = "ru") {
    const normalizedLanguage = normalizeLanguage(language);

    return `
        <button
            type="button"
            class="profile-settings-row profile-settings-row--button"
            data-settings-language
        >
            <div
                class="profile-settings-row__icon profile-settings-row__icon--language"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">language</span>
            </div>

            <div class="profile-settings-row__content">
                <div class="profile-settings-row__title">
                    ${t("profile.settings.language.title")}
                </div>
                <div class="profile-settings-row__description">
                    ${t("profile.settings.language.description")}
                </div>
            </div>

            <div class="profile-settings-row__right">
                <span class="profile-settings-row__value">
                    ${getLanguageLabel(normalizedLanguage)}
                </span>
                <span
                    class="material-symbols-rounded profile-settings-row__chevron"
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </div>
        </button>
    `;
}


function renderTimezoneRow(timezone = "Europe/Kyiv") {
    return `
        <button
            type="button"
            class="profile-settings-row profile-settings-row--button"
            data-settings-timezone
        >
            <div
                class="profile-settings-row__icon profile-settings-row__icon--timezone"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">schedule</span>
            </div>

            <div class="profile-settings-row__content">
                <div class="profile-settings-row__title">
                    ${t("profile.settings.timezone.title")}
                </div>
                <div class="profile-settings-row__description">
                    ${t("profile.settings.timezone.description")}
                </div>
            </div>

            <div class="profile-settings-row__right">
                <span class="profile-settings-row__value">
                    ${getTimezoneLabel(timezone)}
                </span>
                <span
                    class="material-symbols-rounded profile-settings-row__chevron"
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </div>
        </button>
    `;
}


function renderThemeRow(theme = "light") {
    const isDark = theme === "dark";

    return `
        <button
            type="button"
            class="profile-settings-row profile-settings-row--button"
            data-settings-theme
        >
            <div
                class="profile-settings-row__icon profile-settings-row__icon--theme"
                aria-hidden="true"
            >
                <span class="material-symbols-rounded">
                    ${isDark ? "dark_mode" : "light_mode"}
                </span>
            </div>

            <div class="profile-settings-row__content">
                <div class="profile-settings-row__title">
                    ${t("profile.settings.theme.title")}
                </div>
                <div class="profile-settings-row__description">
                    ${t("profile.settings.theme.description")}
                </div>
            </div>

            <div class="profile-settings-row__right">
                <span class="profile-settings-row__value">
                    ${isDark ? t("profile.settings.theme.dark") : t("profile.settings.theme.light")}
                </span>
                <span
                    class="material-symbols-rounded profile-settings-row__chevron"
                    aria-hidden="true"
                >
                    chevron_right
                </span>
            </div>
        </button>
    `;
}


function renderSettingsContent(
    root,
    {
        remindersEnabled = false,
        language = "ru",
        timezone = "Europe/Kyiv",
        theme = "light",
    } = {}
) {
    root.innerHTML = `
        <section class="profile-settings-page">
            ${renderProfileSectionHeader(t("profile.settings.title"))}

            <main class="profile-settings-body">
                <div class="profile-settings-card">
                    ${renderRemindersRow({ enabled: remindersEnabled })}
                    <div class="profile-settings-divider"></div>
                    ${renderLanguageRow(language)}
                    <div class="profile-settings-divider"></div>
                    ${renderTimezoneRow(timezone)}
                    <div class="profile-settings-divider"></div>
                    ${renderThemeRow(theme)}
                </div>
            </main>
        </section>
    `;
}


function updateRemindersToggle(root, enabled) {
    const toggle = root.querySelector("[data-settings-reminders-toggle]");
    if (!toggle) return;

    toggle.classList.toggle("is-enabled", enabled);
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.setAttribute(
        "aria-label",
        enabled
            ? t("profile.settings.reminders.disable")
            : t("profile.settings.reminders.enable")
    );
}


function renderCurrentSettings(root) {
    renderSettingsContent(root, {
        remindersEnabled: Boolean(currentSettings?.reminders_enabled),
        language: normalizeLanguage(currentSettings?.language || "ru"),
        timezone: currentSettings?.timezone || "Europe/Kyiv",
        theme: currentSettings?.theme || "light",
    });

    initSettingsEvents(root);
}


function openLanguageSettings(root) {
    renderProfileLanguagePage(root, {
        currentLanguage: normalizeLanguage(currentSettings?.language || "ru"),

        onLanguageChanged: (settings) => {
            currentSettings = settings;
        },

        onBack: () => {
            renderCurrentSettings(root);
        },
    });
}


function openTimezoneSettings(root) {
    renderProfileTimezonePage(root, {
        currentTimezone: currentSettings?.timezone || "Europe/Kyiv",

        onTimezoneChanged: (settings) => {
            currentSettings = settings;
        },

        onBack: () => {
            renderCurrentSettings(root);
        },
    });
}


function openThemeSettings(root) {
    renderProfileThemePage(root, {
        currentTheme: currentSettings?.theme || "light",

        onThemeChanged: (settings) => {
            currentSettings = settings;
        },

        onBack: () => {
            renderCurrentSettings(root);
        },
    });
}


function initSettingsEvents(root) {
    const remindersToggle = root.querySelector("[data-settings-reminders-toggle]");

    if (remindersToggle) {
        remindersToggle.addEventListener("click", async () => {
            if (remindersRequestInProgress) return;

            const previousValue = Boolean(currentSettings?.reminders_enabled);
            const nextValue = !previousValue;

            remindersRequestInProgress = true;
            remindersToggle.disabled = true;
            updateRemindersToggle(root, nextValue);

            try {
                const settings = await updateRemindersEnabled(nextValue);
                currentSettings = settings;
                updateRemindersToggle(root, Boolean(settings.reminders_enabled));
            } catch (error) {
                console.error("Не удалось изменить напоминания:", error);
                updateRemindersToggle(root, previousValue);
            } finally {
                remindersRequestInProgress = false;

                if (document.contains(remindersToggle)) {
                    remindersToggle.disabled = false;
                }
            }
        });
    }

    root.querySelector("[data-settings-language]")?.addEventListener(
        "click",
        () => openLanguageSettings(root)
    );

    root.querySelector("[data-settings-timezone]")?.addEventListener(
        "click",
        () => openTimezoneSettings(root)
    );

    root.querySelector("[data-settings-theme]")?.addEventListener(
        "click",
        () => openThemeSettings(root)
    );
}


export async function renderProfileSettingsPage(root) {
    if (!root) {
        console.error("Profile Settings: root не передан");
        return;
    }

    renderSettingsContent(root, {
        remindersEnabled: false,
        language: "ru",
        timezone: "Europe/Kyiv",
        theme: "light",
    });

    try {
        const settings = await fetchProfileSettings();
        currentSettings = settings;

        // GET настроек является страховкой, если страницу открыли отдельно.
        // В обычном запуске язык уже установлен из /api/bootstrap.
        setLanguage(settings.language || "ru", { emit: false });
        renderCurrentSettings(root);
    } catch (error) {
        console.error("Не удалось загрузить настройки:", error);

        [
            "[data-settings-reminders-toggle]",
            "[data-settings-language]",
            "[data-settings-timezone]",
            "[data-settings-theme]",
        ].forEach((selector) => {
            const element = root.querySelector(selector);
            if (element) element.disabled = true;
        });
    }
}
