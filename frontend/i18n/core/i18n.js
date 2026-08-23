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

import leaderboardGlobalRu from "../leaderboard/global/ru.js";
import leaderboardGlobalUk from "../leaderboard/global/uk.js";
import leaderboardGlobalEn from "../leaderboard/global/en.js";

import leaderboardSeasonRu from "../leaderboard/season/ru.js";
import leaderboardSeasonUk from "../leaderboard/season/uk.js";
import leaderboardSeasonEn from "../leaderboard/season/en.js";

import profileMainRu from "../profile/main/ru.js";
import profileMainUk from "../profile/main/uk.js";
import profileMainEn from "../profile/main/en.js";

import profileNicknameRu from "../profile/nickname/ru.js";
import profileNicknameUk from "../profile/nickname/uk.js";
import profileNicknameEn from "../profile/nickname/en.js";

import profileStatsRu from "../profile/stats/ru.js";
import profileStatsUk from "../profile/stats/uk.js";
import profileStatsEn from "../profile/stats/en.js";

import profileAchievementsRu from "../profile/achievements/ru.js";
import profileAchievementsUk from "../profile/achievements/uk.js";
import profileAchievementsEn from "../profile/achievements/en.js";

import profileAppearanceRu from "../profile/appearance/ru.js";
import profileAppearanceUk from "../profile/appearance/uk.js";
import profileAppearanceEn from "../profile/appearance/en.js";

import profileSupportRu from "../profile/support/ru.js";
import profileSupportUk from "../profile/support/uk.js";
import profileSupportEn from "../profile/support/en.js";

import profileReferralRu from "../profile/referral/ru.js";
import profileReferralUk from "../profile/referral/uk.js";
import profileReferralEn from "../profile/referral/en.js";

import profileArchiveRu from "../profile/archive/ru.js";
import profileArchiveUk from "../profile/archive/uk.js";
import profileArchiveEn from "../profile/archive/en.js";

import navigationRu from "../common/navigation/ru.js";
import navigationUk from "../common/navigation/uk.js";
import navigationEn from "../common/navigation/en.js";

import settingsMainRu from "../profile/settings/main/ru.js";
import settingsMainUk from "../profile/settings/main/uk.js";
import settingsMainEn from "../profile/settings/main/en.js";

import settingsLanguageRu from "../profile/settings/language/ru.js";
import settingsLanguageUk from "../profile/settings/language/uk.js";
import settingsLanguageEn from "../profile/settings/language/en.js";

import settingsTimezoneRu from "../profile/settings/timezone/ru.js";
import settingsTimezoneUk from "../profile/settings/timezone/uk.js";
import settingsTimezoneEn from "../profile/settings/timezone/en.js";

import settingsThemeRu from "../profile/settings/theme/ru.js";
import settingsThemeUk from "../profile/settings/theme/uk.js";
import settingsThemeEn from "../profile/settings/theme/en.js";

export const SUPPORTED_LANGUAGES = Object.freeze(["ru", "uk", "en"]);

function mergeDictionaries(...parts) {
    return Object.freeze(Object.assign({}, ...parts));
}

const dictionaries = Object.freeze({
    ru: mergeDictionaries(
        settingsMainRu,
        settingsLanguageRu,
        settingsTimezoneRu,
        settingsThemeRu,
        habitsEmptyRu,
        habitsListRu,
        habitDetailsRu,
        addHabitRu,
        emojiRu,
        leaderboardGlobalRu,
        leaderboardSeasonRu,
        profileMainRu,
        profileNicknameRu,
        profileStatsRu,
        profileAchievementsRu,
        profileAppearanceRu,
        profileSupportRu,
        profileReferralRu,
        profileArchiveRu,
        navigationRu,
    ),
    uk: mergeDictionaries(
        settingsMainUk,
        settingsLanguageUk,
        settingsTimezoneUk,
        settingsThemeUk,
        habitsEmptyUk,
        habitsListUk,
        habitDetailsUk,
        addHabitUk,
        emojiUk,
        leaderboardGlobalUk,
        leaderboardSeasonUk,
        profileMainUk,
        profileNicknameUk,
        profileStatsUk,
        profileAchievementsUk,
        profileAppearanceUk,
        profileSupportUk,
        profileReferralUk,
        profileArchiveUk,
        navigationUk,
    ),
    en: mergeDictionaries(
        settingsMainEn,
        settingsLanguageEn,
        settingsTimezoneEn,
        settingsThemeEn,
        habitsEmptyEn,
        habitsListEn,
        habitDetailsEn,
        addHabitEn,
        emojiEn,
        leaderboardGlobalEn,
        leaderboardSeasonEn,
        profileMainEn,
        profileNicknameEn,
        profileStatsEn,
        profileAchievementsEn,
        profileAppearanceEn,
        profileSupportEn,
        profileReferralEn,
        profileArchiveEn,
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
