import { t } from "../../i18n/core/i18n.js";

/* =========================================================
   SHARED API CLIENT
   ========================================================= */

const API_BASE_URL =
    "https://api.ahabit.org";

const REQUEST_TIMEOUT =
    15000;


/* =========================================================
   TELEGRAM INIT DATA
   ========================================================= */

function getTelegramInitData() {
    return (
        window.initData
        || window.Telegram
            ?.WebApp
            ?.initData
        || ""
    );
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getErrorMessage(
    data,
    fallbackMessage
) {
    if (!data) {
        return fallbackMessage;
    }

    if (
        typeof data.detail === "string"
        && data.detail.trim()
    ) {
        return data.detail;
    }

    if (
        typeof data.error === "string"
        && data.error.trim()
    ) {
        return data.error;
    }

    if (
        typeof data.message === "string"
        && data.message.trim()
    ) {
        return data.message;
    }

    return fallbackMessage;
}


/* =========================================================
   SHARED REQUEST
   ========================================================= */

export async function apiRequest(
    endpoint,
    {
        method = "GET",
        body = null,
        headers = {}
    } = {}
) {
    const controller =
        new AbortController();

    const timeoutId =
        window.setTimeout(
            () => {
                controller.abort();
            },
            REQUEST_TIMEOUT
        );

    const requestHeaders = {
        Accept: "application/json",

        "X-Telegram-Init-Data":
            getTelegramInitData(),

        ...headers
    };

    const requestOptions = {
        method,
        headers: requestHeaders,
        signal: controller.signal
    };

    if (body !== null) {
        requestHeaders["Content-Type"] =
            "application/json";

        requestOptions.body =
            JSON.stringify(body);
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                requestOptions
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        const data =
            contentType.includes(
                "application/json"
            )
                ? await response.json()
                : null;

        if (!response.ok) {
            throw new Error(
                getErrorMessage(
                    data,
                    t("common.error.serverStatus", { status: response.status })
                )
            );
        }

        return data;

    } catch (error) {
        if (
            error?.name === "AbortError"
        ) {
            throw new Error(
                t("common.error.timeout")
            );
        }

        if (error instanceof TypeError) {
            throw new Error(
                t("common.error.connection")
            );
        }

        throw error;

    } finally {
        window.clearTimeout(
            timeoutId
        );
    }
}