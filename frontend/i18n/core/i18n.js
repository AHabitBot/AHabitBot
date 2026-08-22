import habitsEmptyRu from "../habits/habitsEmpty/ru.js";
import habitsEmptyUk from "../habits/habitsEmpty/uk.js";
import habitsEmptyEn from "../habits/habitsEmpty/en.js";

import habitsListRu from "../habits/habitsList/ru.js";
import habitsListUk from "../habits/habitsList/uk.js";
import habitsListEn from "../habits/habitsList/en.js";

import habitDetailsRu from "../habits/habitDetails/ru.js";
import habitDetailsUk from "../habits/habitDetails/uk.js";
import habitDetailsEn from "../habits/habitDetails/en.js";

import addHabitRu from "../habits/addHabit/ru.js";
import addHabitUk from "../habits/addHabit/uk.js";
import addHabitEn from "../habits/addHabit/en.js";

import emojiRu from "../habits/emoji/ru.js";
import emojiUk from "../habits/emoji/uk.js";
import emojiEn from "../habits/emoji/en.js";

import navigationRu from "../common/navigation/ru.js";
import navigationUk from "../common/navigation/uk.js";
import navigationEn from "../common/navigation/en.js";

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
        habitsEmptyRu,
        habitsListRu,
        habitDetailsRu,
        addHabitRu,
        emojiRu,
        navigationRu,
    ),
    uk: mergeDictionaries(
        settingsMainUk,
        settingsLanguageUk,
        habitsEmptyUk,
        habitsListUk,
        habitDetailsUk,
        addHabitUk,
        emojiUk,
        navigationUk,
    ),
    en: mergeDictionaries(
        settingsMainEn,
        settingsLanguageEn,
        habitsEmptyEn,
        habitsListEn,
        habitDetailsEn,
        addHabitEn,
        emojiEn,
        navigationEn,
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
