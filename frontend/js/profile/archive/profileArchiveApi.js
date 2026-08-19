import {
    apiRequest
} from "../../api/apiClient.js";

import {
    RESOURCE_KEYS,
    registerResource,
    getResource
} from "../../core/resourceCache.js";

import {
    syncAfterHabitRestore
} from "../../core/dataSync.js";


/* =========================================================
   PROFILE ARCHIVE API
   ========================================================= */


/* =========================================================
   ПОЛУЧИТЬ АРХИВНЫЕ ПРИВЫЧКИ С СЕРВЕРА
   ========================================================= */

export async function fetchArchivedHabits() {
    const data =
        await apiRequest(
            "/api/habits/archived",
            {
                method: "GET",
            }
        );

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        );
    }

    if (
        !Array.isArray(
            data.habits
        )
    ) {
        throw new Error(
            "Сервер не вернул архив привычек"
        );
    }

    return data.habits;
}


/* =========================================================
   RESOURCE CACHE
   ========================================================= */

registerResource(
    RESOURCE_KEYS.ARCHIVED_HABITS,
    fetchArchivedHabits,
);


/* =========================================================
   ПОЛУЧИТЬ АРХИВ

   Первый вызов:
   API → Resource Cache

   Следующие вызовы:
   Resource Cache → мгновенно
   ========================================================= */

export function getArchivedHabits() {
    return getResource(
        RESOURCE_KEYS.ARCHIVED_HABITS
    );
}




/* =========================================================
   ПРИНУДИТЕЛЬНО ПЕРЕЗАГРУЗИТЬ АРХИВ
   ========================================================= */

export function refreshArchivedHabits() {
    return getResource(
        RESOURCE_KEYS.ARCHIVED_HABITS,
        {
            force: true
        }
    );
}



/* =========================================================
   ВОССТАНОВИТЬ ПРИВЫЧКУ
   ========================================================= */

export async function restoreArchivedHabit(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        );
    }

    const data =
        await apiRequest(
            `/api/habits/${habitId}/restore`,
            {
                method: "POST",
            }
        );

    if (
        !data?.success ||
        !data?.habit
    ) {
        throw new Error(
            "Не удалось восстановить привычку"
        );
    }

    /*
     * Основная операция уже выполнена.
     *
     * Если Архив был загружен,
     * его Resource Cache тихо обновится.
     *
     * Этот refresh не блокирует интерфейс.
     */
    void syncAfterHabitRestore();

    return data.habit;
}