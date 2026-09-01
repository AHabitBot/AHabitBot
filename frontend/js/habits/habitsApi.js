import {
    apiRequest
} from "../api/apiClient.js";

import {
    syncAfterHabitArchive,
    syncAfterHabitConfirmation
} from "../core/dataSync.js";


/* =========================================================
   ПОЛУЧИТЬ ПРИВЫЧКИ
   ========================================================= */

export async function fetchHabits() {
    const data =
        await apiRequest(
            "/api/habits"
        );

    if (
        !Array.isArray(
            data?.habits
        )
    ) {
        throw new Error(
            "Некорректный ответ сервера"
        );
    }

    return {
        habits:
            data.habits,

        statistics:
            data.statistics ||
            {}
    };
}


/* =========================================================
   СОЗДАТЬ ПРИВЫЧКУ
   ========================================================= */

export async function createHabit(
    payload
) {
    if (
        !payload ||
        typeof payload !== "object"
    ) {
        throw new Error(
            "Не переданы данные привычки"
        );
    }

    const title =
        String(
            payload.title || ""
        ).trim();

    if (!title) {
        throw new Error(
            "Название привычки обязательно"
        );
    }

    const data =
        await apiRequest(
            "/api/habits",
            {
                method: "POST",

                body: {
                    title,

                    emoji:
                        String(
                            payload.emoji ||
                            "✱"
                        ),

                    color:
                        String(
                            payload.color ||
                            "#A8B58A"
                        ),

                    size:
                        String(
                            payload.size ||
                            "large"
                        ),
                    repeat_type: payload.repeatType || "days",
                    repeat_days: payload.repeatDays || [1,2,3,4,5,6,7],
                    weekly_target: payload.repeatType === "weekly" ? payload.weeklyTarget : null,
                    challenge_target: payload.repeatType === "challenge" ? payload.challengeTarget : null
                }
            }
        );

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул созданную привычку"
        );
    }

    return data.habit;
}


/* =========================================================
   ОБНОВИТЬ ПРИВЫЧКУ
   ========================================================= */

export async function updateHabitApi(
    habitId,
    payload
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        );
    }

    const title =
        String(
            payload.title || ""
        ).trim();

    if (!title) {
        throw new Error(
            "Название привычки обязательно"
        );
    }

    const data =
        await apiRequest(
            `/api/habits/${habitId}`,
            {
                method: "PATCH",

                body: {
                    title,

                    emoji:
                        String(
                            payload.emoji ||
                            "✱"
                        ),

                    color:
                        String(
                            payload.color ||
                            "blue"
                        ),

                    size:
                        String(
                            payload.size ||
                            "large"
                        ),
                    repeat_type: payload.repeatType || "days",
                    repeat_days: payload.repeatDays || [1,2,3,4,5,6,7],
                    weekly_target: payload.repeatType === "weekly" ? payload.weeklyTarget : null,
                    challenge_target: payload.repeatType === "challenge" ? payload.challengeTarget : null
                }
            }
        );

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул обновлённую привычку"
        );
    }

    return data.habit;
}


/* =========================================================
   ПОДТВЕРДИТЬ / СНЯТЬ ПОДТВЕРЖДЕНИЕ
   ========================================================= */

export async function setHabitConfirmation(
    habitId,
    isConfirmed
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        );
    }

    const data =
        await apiRequest(
            `/api/habits/${habitId}/confirmation`,
            {
                method: "PUT",

                body: {
                    is_confirmed:
                        Boolean(
                            isConfirmed
                        )
                }
            }
        );

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул состояние привычки"
        );
    }

    /*
     * Сервер уже успешно изменил
     * подтверждение привычки.
     *
     * Теперь тихо обновляем только
     * существующие кэши:
     *
     * - игровые показатели;
     * - глобальный рейтинг;
     * - сезонный рейтинг.
     *
     * await здесь специально НЕ нужен.
     * Пользователь не ждёт пересчёта.
     */

    void syncAfterHabitConfirmation()
        .catch(
            (error) => {
                console.warn(
                    "Habit confirmation background sync failed",
                    error
                );
            }
        );

    return data;
}


/* =========================================================
   АРХИВИРОВАТЬ ПРИВЫЧКУ
   ========================================================= */

export async function archiveHabitApi(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        );
    }

    const data =
        await apiRequest(
            `/api/habits/${habitId}/archive`,
            {
                method: "PATCH"
            }
        );

    if (!data?.success) {
        throw new Error(
            "Не удалось архивировать привычку"
        );
    }

    /*
     * Если Архив уже был открыт,
     * тихо обновляем его кэш.
     *
     * Если Архив ещё ни разу
     * не открывался — дополнительного
     * API-запроса не будет.
     */

    void syncAfterHabitArchive()
        .catch(
            (error) => {
                console.warn(
                    "Habit archive background sync failed",
                    error
                );
            }
        );

    return data;
}
