import settingsMainRu from "../profile/settings/main/ru.js";
import settingsMainUk from "../profile/settings/main/uk.js";
import settingsMainEn from "../profile/settings/main/en.js";

import settingsLanguageRu from "../profile/settings/language/ru.js";
import settingsLanguageUk from "../profile/settings/language/uk.js";
import settingsLanguageEn from "../profile/settings/language/en.js";

export const SUPPORTED_LANGUAGES = Object.freeze(["ru", "uk", "en"]);

function mergeDictionaries(...parts) {
    return Object.freeze(Object.assign({}, ...parts));
}

const dictionaries = Object.freeze({
    ru: mergeDictionaries(
        settingsMainRu,
        settingsLanguageRu,
    ),
    uk: mergeDictionaries(
        settingsMainUk,
        settingsLanguageUk,
    ),
    en: mergeDictionaries(
        settingsMainEn,
        settingsLanguageEn,
    ),
});

let currentLanguage = "ru";

export function normalizeLanguage(language) {
    const normalized = String(language || "").trim().toLowerCase();
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : "ru";
}

export function getLanguage() {
    return currentLanguage;
}

export function setLanguage(language, { emit = true } = {}) {
    const nextLanguage = normalizeLanguage(language);
    const changed = nextLanguage !== currentLanguage;

    currentLanguage = nextLanguage;
    document.documentElement.lang = nextLanguage;

    if (emit && changed) {
        window.dispatchEvent(
            new CustomEvent("app:languagechange", {
                detail: { language: nextLanguage },
            })
        );
    }

    return currentLanguage;
}

export function t(key, params = {}) {
    const dictionary = dictionaries[currentLanguage] || dictionaries.ru;
    const fallback = dictionaries.ru;
    let value = dictionary[key] ?? fallback[key] ?? key;

    if (typeof value !== "string") {
        return String(value ?? key);
    }

    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
        return Object.prototype.hasOwnProperty.call(params, paramName)
            ? String(params[paramName])
            : match;
    });
}

export function getLanguageLabel(language) {
    const code = normalizeLanguage(language);
    return t(`profile.settings.language.option.${code}`);
}
