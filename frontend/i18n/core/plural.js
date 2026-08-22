import { getLanguage } from "./i18n.js";


export function getPluralForm(value) {
    const count = Math.abs(
        Math.trunc(Number(value) || 0)
    );

    const language = getLanguage();

    if (language === "en") {
        return count === 1
            ? "one"
            : "other";
    }

    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;

    if (
        lastTwoDigits >= 11
        && lastTwoDigits <= 14
    ) {
        return "many";
    }

    if (lastDigit === 1) {
        return "one";
    }

    if (
        lastDigit >= 2
        && lastDigit <= 4
    ) {
        return "few";
    }

    return "many";
}
