import {
    apiRequest
} from "../api/apiClient.js";


/* =========================================================
   
   ========================================================= */

export async function fetchHabits() {
    const data = await apiRequest("/api/habits")

    if (!Array.isArray(data?.habits)) {
        throw new Error(
            "Некорректный ответ сервера"
        )
    }

    return {
        habits: data.habits,
        statistics: data.statistics || {}
    }
}


/* =========================================================
   СОЗДАТЬ ПРИВЫЧКУ

   payload:

   {
       title,
       emoji,
       color,
       size
   }

   Backend должен вернуть:

   {
       "habit": {
           id,
           title,
           emoji,
           color,
           size,
           ...
       }
   }
   ========================================================= */

export async function createHabit(payload) {
    if (!payload || typeof payload !== "object") {
        throw new Error(
            "Не переданы данные привычки"
        )
    }

    const title =
        String(payload.title || "").trim()

    if (!title) {
        throw new Error(
            "Название привычки обязательно"
        )
    }

    const data = await apiRequest(
        "/api/habits",
        {
            method: "POST",
            body: {
                title,
                emoji:
                    String(
                        payload.emoji || "✱"
                    ),
                color:
                    String(
                        payload.color || "#A8B58A"
                    ),
                size:
                    String(
                        payload.size || "large"
                    )
            }
        }
    )

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул созданную привычку"
        )
    }

    return data.habit
}



export async function updateHabitApi(
    habitId,
    payload
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        )
    }

    const title =
        String(payload.title || "").trim()

    if (!title) {
        throw new Error(
            "Название привычки обязательно"
        )
    }

    const data = await apiRequest(
        `/api/habits/${habitId}`,
        {
            method: "PATCH",
            body: {
                title,
                emoji:
                    String(payload.emoji || "✱"),
                color:
                    String(payload.color || "blue"),
                size:
                    String(payload.size || "large")
            }
        }
    )

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул обновлённую привычку"
        )
    }

    return data.habit
}

/* =========================================================
   УСТАНОВИТЬ ПОДТВЕРЖДЕНИЕ ПРИВЫЧКИ

   isConfirmed = true  — подтвердить
   isConfirmed = false — отменить
   ========================================================= */

export async function setHabitConfirmation(
    habitId,
    isConfirmed
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        )
    }

    const data = await apiRequest(
        `/api/habits/${habitId}/confirmation`,
        {
            method: "PUT",
            body: {
                is_confirmed:
                    Boolean(isConfirmed)
            }
        }
    )

    if (!data?.habit) {
        throw new Error(
            "Сервер не вернул состояние привычки"
        )
    }

    return data
}



export async function archiveHabitApi(
    habitId
) {
    if (!habitId) {
        throw new Error(
            "Не передан ID привычки"
        )
    }

    const data = await apiRequest(
        `/api/habits/${habitId}/archive`,
        {
            method: "PATCH"
        }
    )

    if (!data?.success) {
        throw new Error(
            "Не удалось архивировать привычку"
        )
    }

    return data
}