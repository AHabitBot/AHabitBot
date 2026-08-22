import {
    getLanguage,
    t
} from "../../../i18n/core/i18n.js";


function formatEmptyPageDate() {
    const language = getLanguage();

    const localeByLanguage = {
        ru: "ru-RU",
        uk: "uk-UA",
        en: "en-US"
    };

    const locale =
        localeByLanguage[language]
        || localeByLanguage.ru;

    const formatted =
        new Intl.DateTimeFormat(
            locale,
            {
                weekday: "short",
                day: "numeric",
                month: "long"
            }
        ).format(new Date());

    return formatted.charAt(0).toUpperCase()
        + formatted.slice(1);
}


export function renderHabitsEmpty() {
    return `
        <section class="habits-v2-empty">
            <div class="habits-v2-empty__content">

                <div class="habits-v2-empty__date">
                    ${formatEmptyPageDate()}
                </div>

                <h1 class="habits-v2-empty__title">
                    ${t("habits.empty.title")}
                </h1>

                <div class="habits-v2-empty__subtitle">
                    ${t("habits.empty.subtitle")}
                </div>

                <button
                    class="habits-v2-empty__add-button"
                    type="button"
                    aria-label="${t("habits.empty.createAria")}"
                    data-action="open-add-habit"
                >
                    +
                </button>

            </div>
        </section>
    `;
}
