import { renderProfileSectionHeader } from "../profileComponents.js";
import { updateLanguage } from "./profileSettingsApi.js";
import {
    getLanguageLabel,
    normalizeLanguage,
    setLanguage,
    t
} from "../../../i18n/core/i18n.js";

const LANGUAGE_OPTIONS = Object.freeze([
    { value: "ru" },
    { value: "uk" },
    { value: "en" },
]);

let languageRequestInProgress = false;

function renderLanguageOption(option, currentLanguage) {
    const selected = option.value === currentLanguage;

    return `
        <button
            type="button"
            class="profile-timezone-option ${selected ? "is-selected" : ""}"
            data-language-value="${option.value}"
        >
            <div class="profile-timezone-option__content">
                <div class="profile-timezone-option__label">
                    ${getLanguageLabel(option.value)}
                </div>
            </div>

            <div class="profile-timezone-option__status">
                ${selected ? `
                    <span
                        class="material-symbols-rounded profile-timezone-option__check"
                        aria-hidden="true"
                    >
                        check_circle
                    </span>
                ` : `
                    <span
                        class="profile-timezone-option__circle"
                        aria-hidden="true"
                    ></span>
                `}
            </div>
        </button>
    `;
}

function renderLanguageList(currentLanguage) {
    return `
        <div class="profile-timezone-list">
            ${LANGUAGE_OPTIONS
                .map((option) => renderLanguageOption(option, currentLanguage))
                .join("")}
        </div>
    `;
}

export function renderProfileLanguagePage(
    root,
    {
        currentLanguage = "ru",
        onLanguageChanged = null,
        onBack = null,
    } = {}
) {
    if (!root) {
        console.error("Profile Language: root не передан");
        return;
    }

    currentLanguage = normalizeLanguage(currentLanguage);

    root.innerHTML = `
        <section class="profile-timezone-page profile-language-page">
            ${renderProfileSectionHeader(t("profile.settings.language.page.title"))}

            <main class="profile-timezone-body">
                <div class="profile-timezone-card">
                    ${renderLanguageList(currentLanguage)}
                </div>
            </main>
        </section>
    `;

    const page = root.querySelector(".profile-language-page");
    if (!page) return;

    page.addEventListener("click", async (event) => {
        const backButton = event.target.closest("[data-profile-back]");

        if (backButton) {
            event.stopPropagation();
            onBack?.();
            return;
        }

        const optionButton = event.target.closest("[data-language-value]");
        if (!optionButton || languageRequestInProgress) return;

        const nextLanguage = normalizeLanguage(optionButton.dataset.languageValue);
        if (nextLanguage === currentLanguage) return;

        languageRequestInProgress = true;
        const buttons = page.querySelectorAll("[data-language-value]");
        buttons.forEach((button) => { button.disabled = true; });

        try {
            const settings = await updateLanguage(nextLanguage);
            currentLanguage = normalizeLanguage(settings.language);

            // Сначала меняем только язык представления.
            // Игровые данные и Resource Cache не перезагружаются.
            setLanguage(currentLanguage);

            onLanguageChanged?.(settings);
            onBack?.();
        } catch (error) {
            console.error("Не удалось изменить язык:", error);

            if (document.contains(page)) {
                buttons.forEach((button) => { button.disabled = false; });
            }
        } finally {
            languageRequestInProgress = false;
        }
    });
}
