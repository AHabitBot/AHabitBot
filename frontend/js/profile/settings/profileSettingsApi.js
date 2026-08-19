import {
    apiRequest
} from "../../api/apiClient.js";


/* =========================================================
   PROFILE SETTINGS API
   ========================================================= */


/* =========================================================
   ПОЛУЧИТЬ НАСТРОЙКИ
   ========================================================= */

export async function fetchProfileSettings() {
    const data =
        await apiRequest(
            "/api/settings",
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


    return data;
}


/* =========================================================
   ВКЛЮЧИТЬ / ВЫКЛЮЧИТЬ НАПОМИНАНИЯ
   ========================================================= */

export async function updateRemindersEnabled(
    enabled
) {
    const data =
        await apiRequest(
            "/api/settings/reminders",
            {
                method: "PATCH",

                body: {
                    enabled:
                        Boolean(enabled),
                },
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
        typeof data.reminders_enabled
        !== "boolean"
    ) {
        throw new Error(
            "Сервер не вернул состояние напоминаний"
        );
    }


    return data;
}

/* =========================================================
   ИЗМЕНИТЬ ЧАСОВОЙ ПОЯС
   ========================================================= */

export async function updateTimezone(
    timezone
) {
    const normalizedTimezone =
        String(
            timezone || ""
        ).trim();


    if (!normalizedTimezone) {
        throw new Error(
            "Не передан часовой пояс"
        );
    }


    const data =
        await apiRequest(
            "/api/settings/timezone",
            {
                method: "PATCH",

                body: {
                    timezone:
                        normalizedTimezone,
                },
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
        typeof data.timezone !==
        "string"
    ) {
        throw new Error(
            "Сервер не вернул часовой пояс"
        );
    }


    return data;
}
/* =========================================================
   ИЗМЕНИТЬ ТЕМУ
   ========================================================= */

export async function updateTheme(theme) {
    const normalizedTheme = String(theme || "").trim().toLowerCase();

    if (!["light", "dark"].includes(normalizedTheme)) {
        throw new Error("Некорректная тема");
    }

    const data = await apiRequest(
        "/api/settings/theme",
        {
            method: "PATCH",
            body: { theme: normalizedTheme },
        }
    );

    if (!data || typeof data !== "object" || !["light", "dark"].includes(data.theme)) {
        throw new Error("Сервер не вернул тему");
    }

    return data;
}
