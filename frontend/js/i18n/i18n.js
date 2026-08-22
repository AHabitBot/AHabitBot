import ru from "./ru.js";
import uk from "./uk.js";
import en from "./en.js";

export const SUPPORTED_LANGUAGES = Object.freeze(["ru", "uk", "en"]);

const dictionaries = Object.freeze({ ru, uk, en });
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

    document.documentElement.lang = nextLanguage === "uk" ? "uk" : nextLanguage;

    if (emit && changed) {
        window.dispatchEvent(new CustomEvent("app:languagechange", {
            detail: { language: nextLanguage }
        }));
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
    return t(`language.${code}`);
}
