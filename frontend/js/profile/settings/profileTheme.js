import { renderProfileSectionHeader } from "../profileComponents.js";
import { updateTheme } from "./profileSettingsApi.js";
import { applyTheme } from "../../core/theme.js";

const THEME_OPTIONS = [
    { label: "Светлая", value: "light", icon: "light_mode" },
    { label: "Тёмная", value: "dark", icon: "dark_mode" },
];

let requestInProgress = false;

function renderOptions(currentTheme) {
    return THEME_OPTIONS.map((option) => {
        const selected = option.value === currentTheme;
        return `
            <button type="button"
                class="profile-theme-option ${selected ? "is-selected" : ""}"
                data-theme-value="${option.value}">
                <span class="material-symbols-rounded profile-theme-option__icon">${option.icon}</span>
                <span class="profile-theme-option__label">${option.label}</span>
                <span class="material-symbols-rounded profile-theme-option__check">
                    ${selected ? "check_circle" : "radio_button_unchecked"}
                </span>
            </button>
        `;
    }).join("");
}

export function renderProfileThemePage(
    root,
    { currentTheme = "light", onThemeChanged = null, onBack = null } = {}
) {
    root.innerHTML = `
        <section class="profile-theme-page">
            ${renderProfileSectionHeader("Тема")}
            <main class="profile-theme-body">
                <div class="profile-theme-card">
                    ${renderOptions(currentTheme)}
                </div>
            </main>
        </section>
    `;

    const page = root.querySelector(".profile-theme-page");
    if (!page) return;

    page.addEventListener("click", async (event) => {
        const back = event.target.closest("[data-profile-back]");
        if (back) {
            event.stopPropagation();
            onBack?.();
            return;
        }

        const button = event.target.closest("[data-theme-value]");
        if (!button || requestInProgress) return;

        const nextTheme = button.dataset.themeValue;
        if (!nextTheme || nextTheme === currentTheme) return;

        requestInProgress = true;
        const previousTheme = currentTheme;

        // Мгновенное переключение без ожидания сети.
        applyTheme(nextTheme);
        page.querySelectorAll("[data-theme-value]").forEach((item) => {
            item.disabled = true;
        });

        try {
            const settings = await updateTheme(nextTheme);
            currentTheme = settings.theme;
            applyTheme(currentTheme);
            onThemeChanged?.(settings);
            onBack?.();
        } catch (error) {
            console.error("Не удалось изменить тему:", error);
            applyTheme(previousTheme);
            page.querySelectorAll("[data-theme-value]").forEach((item) => {
                item.disabled = false;
            });
        } finally {
            requestInProgress = false;
        }
    });
}
