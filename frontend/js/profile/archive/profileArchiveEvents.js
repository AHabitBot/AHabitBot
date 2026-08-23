import { t } from "../../../i18n/core/i18n.js";

import {
    refreshArchivedHabits,
    restoreArchivedHabit
} from "./profileArchiveApi.js";

import {
    renderProfileArchive
} from "./profileArchive.js";

import {
    addHabit
} from "../../habits/habitsStore.js";

import {
    normalizeHabit
} from "../../habits/habitsUtils.js";


/* =========================================================
   PROFILE ARCHIVE EVENTS
   ========================================================= */

const initializedRoots =
    new WeakSet();

const pendingRestores =
    new Set();


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

export function initProfileArchiveEvents(
    root
) {
    if (!root) {
        return;
    }

    if (
        initializedRoots.has(root)
    ) {
        return;
    }

    root.addEventListener(
        "click",
        (event) => {
            void handleArchiveClick(
                event,
                root
            );
        }
    );

    initializedRoots.add(
        root
    );
}


/* =========================================================
   ОБРАБОТКА НАЖАТИЙ
   ========================================================= */

async function handleArchiveClick(
    event,
    root
) {
    /* -----------------------------------------------------
       ВОССТАНОВИТЬ ПРИВЫЧКУ
       ----------------------------------------------------- */

    const restoreButton =
        event.target.closest(
            "[data-archive-restore]"
        );

    if (restoreButton) {
        const habitId =
            Number(
                restoreButton.dataset.habitId
            );

        if (!habitId) {
            return;
        }

        await handleRestoreHabit(
            root,
            restoreButton,
            habitId
        );

        return;
    }


    /* -----------------------------------------------------
       ПОВТОРНАЯ ЗАГРУЗКА ПОСЛЕ ОШИБКИ
       ----------------------------------------------------- */

    const retryButton =
        event.target.closest(
            "[data-profile-archive-retry]"
        );

    if (retryButton) {
        await reloadArchive(
            root
        );
    }
}


/* =========================================================
   ВОССТАНОВИТЬ ПРИВЫЧКУ
   ========================================================= */

async function handleRestoreHabit(
    root,
    button,
    habitId
) {
    if (
        pendingRestores.has(
            habitId
        )
    ) {
        return;
    }

    pendingRestores.add(
        habitId
    );

    const originalText =
        button.textContent;

    button.disabled =
        true;

    button.textContent =
        t("profile.archive.restoring");


    try {
        const restoredHabit =
            await restoreArchivedHabit(
                habitId
            );


        /*
         * Сразу возвращаем привычку
         * в активный habitsStore.
         *
         * Поэтому при переходе на Главную
         * отдельный GET /api/habits не нужен.
         */

        addHabit(
            normalizeHabit(
                restoredHabit
            )
        );


        /*
         * Карточку убираем сразу.
         *
         * Не ждём фонового refresh Resource Cache.
         */

        const card =
            root.querySelector(
                `[data-archive-habit-id="${habitId}"]`
            );

        if (card) {
            card.remove();
        }


        /*
         * Если это была последняя привычка —
         * показываем empty state.
         */

        const remainingCards =
            root.querySelectorAll(
                "[data-archive-habit-id]"
            );

        if (
            remainingCards.length ===
            0
        ) {
            renderProfileArchive(
                []
            );
        }

    } catch (error) {
        console.error(
            "Profile Archive: ошибка восстановления",
            error
        );

        button.disabled =
            false;

        button.textContent =
            originalText ||
            t("profile.archive.restore");

        showRestoreError();
    } finally {
        pendingRestores.delete(
            habitId
        );
    }
}



/* =========================================================
   ПЕРЕЗАГРУЗИТЬ АРХИВ
   ========================================================= */

async function reloadArchive(
    root
) {
    try {
        const habits =
            await refreshArchivedHabits();

        renderProfileArchive(
            habits
        );

    } catch (error) {
        console.error(
            "Profile Archive: повторная загрузка не удалась",
            error
        );
    }
}

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showRestoreError() {
    const telegram =
        window.Telegram?.WebApp;

    const message =
        t("profile.archive.error.restore");

    if (
        telegram &&
        typeof telegram.showAlert ===
            "function"
    ) {
        telegram.showAlert(
            message
        );

        return;
    }

    console.warn(
        message
    );
}