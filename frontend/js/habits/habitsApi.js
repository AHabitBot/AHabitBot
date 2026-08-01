/* =========================================================
   HABITS API

   Клиент для взаимодействия frontend с backend.

   Отвечает за:
   - отправку HTTP-запросов;
   - передачу Telegram initData;
   - получение списка привычек;
   - создание новой привычки;
   - обработку ошибок сервера.

   Этот файл не работает с PostgreSQL напрямую.
   Работа с базой данных происходит на Python backend.
   ========================================================= */


/* =========================================================
   НАСТРОЙКИ API

   Пустая строка означает текущий домен:

   /api/habits

   Это подходит, когда frontend и backend работают
   через один домен.
   ========================================================= */

const API_BASE_URL = "https://api.ahabit.org"

const REQUEST_TIMEOUT = 15000


/* =========================================================
   TELEGRAM INIT DATA
   ========================================================= */

function getTelegramInitData() {
    return (
        window.initData ||
        window.Telegram?.WebApp?.initData ||
        ""
    )
}


/* =========================================================
   ПОЛУЧИТЬ ТЕКСТ ОШИБКИ
   ========================================================= */

function getErrorMessage(data, fallbackMessage) {
    if (!data) {
        return fallbackMessage
    }

    if (
        typeof data.detail === "string" &&
        data.detail.trim()
    ) {
        return data.detail
    }

    if (
        typeof data.error === "string" &&
        data.error.trim()
    ) {
        return data.error
    }

    if (
        typeof data.message === "string" &&
        data.message.trim()
    ) {
        return data.message
    }

    return fallbackMessage
}


/* =========================================================
   ОБЩИЙ HTTP-ЗАПРОС
   ========================================================= */

async function apiRequest(
    endpoint,
    {
        method = "GET",
        body = null,
        headers = {}
    } = {}
) {
    const controller =
        new AbortController()

    const timeoutId = window.setTimeout(
        () => {
            controller.abort()
        },
        REQUEST_TIMEOUT
    )

    const requestHeaders = {
        Accept: "application/json",
        "X-Telegram-Init-Data":
            getTelegramInitData(),
        ...headers
    }

    const requestOptions = {
        method,
        headers: requestHeaders,
        signal: controller.signal
    }

    if (body !== null) {
        requestHeaders["Content-Type"] =
            "application/json"

        requestOptions.body =
            JSON.stringify(body)
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            requestOptions
        )

        const contentType =
            response.headers.get(
                "content-type"
            ) || ""

        const data =
            contentType.includes(
                "application/json"
            )
                ? await response.json()
                : null

        if (!response.ok) {
            throw new Error(
                getErrorMessage(
                    data,
                    `Ошибка сервера: ${response.status}`
                )
            )
        }

        return data
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "Сервер не ответил вовремя"
            )
        }

        if (error instanceof TypeError) {
            throw new Error(
                "Не удалось подключиться к серверу"
            )
        }

        throw error
    } finally {
        window.clearTimeout(timeoutId)
    }
}


/* =========================================================
   ПОЛУЧИТЬ ПРИВЫЧКИ

   Backend должен вернуть:

   {
       "habits": [...]
   }
   ========================================================= */

export async function fetchHabits() {
    const data = await apiRequest(
        "/api/habits"
    )

    if (!Array.isArray(data?.habits)) {
        console.warn(
            "Habits API: сервер вернул некорректный список привычек"
        )

        return []
    }

    return data.habits
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