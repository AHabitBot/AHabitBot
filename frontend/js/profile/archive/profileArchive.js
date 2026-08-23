import { t } from "../../../i18n/core/i18n.js";
import { getPluralForm } from "../../../i18n/core/plural.js";

import {
    renderProfileSectionHeader
} from "../profileComponents.js";

import {
    getArchivedHabits
} from "./profileArchiveApi.js";

import {
    initProfileArchiveEvents
} from "./profileArchiveEvents.js";


/* =========================================================
   PROFILE ARCHIVE
   ========================================================= */

let archiveRoot = null;


/* =========================================================
   ФОРМАТИРОВАНИЕ ДАТЫ АРХИВАЦИИ
   ========================================================= */

function formatArchivedDate(
    archivedAt
) {
    if (!archivedAt) {
        return "";
    }

    const date =
        new Date(
            archivedAt
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(
        date
    );
}


/* =========================================================
   СКЛОНЕНИЕ ДНЕЙ
   ========================================================= */

function getDayWord(
    value
) {
    const number =
        Math.abs(
            Number(value) || 0
        );

    const lastTwo =
        number % 100;

    const last =
        number % 10;

    if (
        lastTwo >= 11 &&
        lastTwo <= 14
    ) {
        return "дней";
    }

    if (last === 1) {
        return "день";
    }

    if (
        last >= 2 &&
        last <= 4
    ) {
        return "дня";
    }

    return "дней";
}


/* =========================================================
   ПУСТОЙ АРХИВ
   ========================================================= */

function renderEmptyState() {
    return `
        <div class="profile-archive-empty">

            <div class="profile-archive-empty__illustration">

                <div class="profile-archive-empty__box">

                    <span
                        class="
                            profile-archive-empty__box-line
                        "
                    ></span>

                    <span
                        class="
                            profile-archive-empty__box-line
                        "
                    ></span>

                    <span
                        class="
                            profile-archive-empty__box-line
                        "
                    ></span>

                </div>

                <div
                    class="
                        profile-archive-empty__leaf
                        profile-archive-empty__leaf--left
                    "
                ></div>

                <div
                    class="
                        profile-archive-empty__leaf
                        profile-archive-empty__leaf--right
                    "
                ></div>

            </div>


            <h2 class="profile-archive-empty__title">
                ${t("profile.archive.empty.title")}
            </h2>


            <p class="profile-archive-empty__text">
                ${t("profile.archive.empty.text")}
            </p>

        </div>
    `;
}


/* =========================================================
   КАРТОЧКА АРХИВНОЙ ПРИВЫЧКИ
   ========================================================= */

function renderArchivedHabitCard(
    habit
) {
    const habitId =
        Number(
            habit?.id
        );

    const title =
        String(
            habit?.title ||
            t("profile.archive.habitFallback")
        );

    const emoji =
        String(
            habit?.emoji ||
            "✱"
        );

    const archivedDate =
        formatArchivedDate(
            habit?.archived_at
        );

    const completedCount =
        Number(
            habit?.completed_count ||
            0
        );

    const maxStreak =
        Number(
            habit?.max_streak ||
            0
        );

    const archiveDateText =
        archivedDate
            ? t("profile.archive.archivedSince", { date: archivedDate })
            : t("profile.archive.archived");


    return `
        <article
            class="profile-archive-card"
            data-archive-habit-id="${habitId}"
        >

            <div class="profile-archive-card__top">

                <div class="profile-archive-card__identity">

                    <div class="profile-archive-card__emoji">
                        ${emoji}
                    </div>


                    <div class="profile-archive-card__info">

                        <h3 class="profile-archive-card__title">
                            ${title}
                        </h3>

                        <p class="profile-archive-card__date">
                            ${archiveDateText}
                        </p>

                    </div>

                </div>


                <button
                    class="profile-archive-card__restore"
                    type="button"
                    data-archive-restore
                    data-habit-id="${habitId}"
                >
                    <span
                        class="
                            material-symbols-rounded
                            profile-archive-card__restore-icon
                        "
                        aria-hidden="true"
                    >
                        history
                    </span>

                    <span>
                        Восстановить
                    </span>
                </button>

            </div>


            <div class="profile-archive-card__stats">

                <div class="profile-archive-card__stat">

                    <span
                        class="
                            material-symbols-rounded
                            profile-archive-card__stat-icon
                            profile-archive-card__stat-icon--confirmations
                        "
                        aria-hidden="true"
                    >
                        task_alt
                    </span>


                    <div class="profile-archive-card__stat-content">

                        <strong class="profile-archive-card__stat-value">
                            ${completedCount}
                        </strong>

                        <span class="profile-archive-card__stat-label">
                            Подтверждений
                        </span>

                    </div>

                </div>


                <div class="profile-archive-card__divider"></div>


                <div class="profile-archive-card__stat">

                    <span
                        class="
                            material-symbols-rounded
                            profile-archive-card__stat-icon
                            profile-archive-card__stat-icon--streak
                        "
                        aria-hidden="true"
                    >
                        local_fire_department
                    </span>


                    <div class="profile-archive-card__stat-content">

                        <strong class="profile-archive-card__stat-value">
                            ${maxStreak}
                            ${getDayWord(maxStreak)}
                        </strong>

                        <span class="profile-archive-card__stat-label">
                            Лучшая серия
                        </span>

                    </div>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   СПИСОК АРХИВНЫХ ПРИВЫЧЕК

   ВАЖНО:
   список вертикальный.

   Скролл находится на .profile-archive-body,
   поэтому карточки просто идут сверху вниз.
   ========================================================= */

function renderArchiveList(
    habits
) {
    return `
        <div class="profile-archive-list">

            ${
                habits
                    .map(
                        renderArchivedHabitCard
                    )
                    .join("")
            }

        </div>
    `;
}


/* =========================================================
   ОПИСАНИЕ
   ========================================================= */

function renderArchiveHeading() {
    return `
        <div class="profile-archive-heading">

            <p class="profile-archive-heading__text">
                ${t("profile.archive.description")}
            </p>

        </div>
    `;
}


/* =========================================================
   ОСНОВНАЯ СТРАНИЦА
   ========================================================= */

function renderArchivePage(
    habits
) {
    const hasHabits =
        Array.isArray(
            habits
        ) &&
        habits.length > 0;


    return `
        <section class="profile-archive-page">

            ${renderProfileSectionHeader(
                t("profile.archive.title")
            )}


            ${renderArchiveHeading()}


            <main class="profile-archive-body">

                ${
                    hasHabits
                        ? renderArchiveList(
                            habits
                        )
                        : renderEmptyState()
                }

            </main>

        </section>
    `;
}


/* =========================================================
   LOADING
   ========================================================= */

function renderLoading() {
    if (!archiveRoot) {
        return;
    }


    archiveRoot.innerHTML = `
        <section class="profile-archive-page">

            ${renderProfileSectionHeader(
                t("profile.archive.title")
            )}


            ${renderArchiveHeading()}


            <main class="profile-archive-body">

                <div class="profile-archive-loading">

                    <div
                        class="
                            profile-archive-loading__card
                        "
                    ></div>

                    <div
                        class="
                            profile-archive-loading__card
                        "
                    ></div>

                    <div
                        class="
                            profile-archive-loading__card
                        "
                    ></div>

                </div>

            </main>

        </section>
    `;
}


/* =========================================================
   ERROR
   ========================================================= */

function renderError() {
    if (!archiveRoot) {
        return;
    }


    archiveRoot.innerHTML = `
        <section class="profile-archive-page">

            ${renderProfileSectionHeader(
                t("profile.archive.title")
            )}


            <main class="profile-archive-body">

                <div class="profile-archive-error">

                    <span
                        class="
                            material-symbols-rounded
                            profile-archive-error__icon
                        "
                        aria-hidden="true"
                    >
                        error_outline
                    </span>


                    <p class="profile-archive-error__title">
                        Не удалось загрузить архив
                    </p>


                    <button
                        type="button"
                        class="profile-archive-error__retry"
                        data-profile-archive-retry
                    >
                        Попробовать снова
                    </button>

                </div>

            </main>

        </section>
    `;
}


/* =========================================================
   ПЕРЕРИСОВАТЬ СТРАНИЦУ
   ========================================================= */

export function renderProfileArchive(
    habits
) {
    if (!archiveRoot) {
        return;
    }


    archiveRoot.innerHTML =
        renderArchivePage(
            habits
        );
}


/* =========================================================
   ОТКРЫТЬ АРХИВ
   ========================================================= */

export async function renderProfileArchivePage(
    root
) {
    if (!root) {
        console.error(
            "Profile Archive: root не передан"
        );

        return;
    }


    archiveRoot =
        root;


    initProfileArchiveEvents(
        root
    );


    renderLoading();


    try {
        const habits =
            await getArchivedHabits();


        renderProfileArchive(
            habits
        );

    } catch (error) {
        console.error(
            "Profile Archive: ошибка загрузки",
            error
        );


        renderError();
    }
}