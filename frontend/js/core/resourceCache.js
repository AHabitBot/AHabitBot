/* =========================================================
   RESOURCE CACHE

   Общий in-memory кэш данных Mini App.

   Правила:
   - если данные уже есть — возвращаем их моментально;
   - одинаковые параллельные запросы объединяются в один;
   - force=true тихо заменяет старый кэш новым;
   - если force приходит во время текущего запроса —
     после него автоматически запускается ещё один refresh;
   - TTL отсутствует: свежесть управляется событиями приложения.
   ========================================================= */

export const RESOURCE_KEYS = Object.freeze({
    PROFILE: "profile",

    STATS_WEEK: "stats:week",
    STATS_MONTH: "stats:month",
    STATS_YEAR: "stats:year",
    STATS_SEASONS: "stats:seasons",

    LEADERBOARD_GLOBAL: "leaderboard:global",
    LEADERBOARD_SEASON: "leaderboard:season",

    ACHIEVEMENTS: "achievements",
    REFERRAL: "referral",

    ARCHIVED_HABITS: "archived_habits",
})


const resources = new Map()


/* =========================================================
   ПОЛУЧИТЬ / СОЗДАТЬ RESOURCE
   ========================================================= */

function ensureResource(key) {
    if (!resources.has(key)) {
        resources.set(
            key,
            {
                data: null,

                hasData: false,

                loader: null,

                request: null,

                refreshQueued: false,
            }
        )
    }

    return resources.get(key)
}


/* =========================================================
   ЗАРЕГИСТРИРОВАТЬ LOADER
   ========================================================= */

export function registerResource(
    key,
    loader
) {
    if (!key) {
        throw new Error(
            "Resource Cache: не передан ключ ресурса"
        )
    }

    if (
        typeof loader !==
        "function"
    ) {
        throw new Error(
            `Resource Cache: для "${key}" не передан loader`
        )
    }

    const resource =
        ensureResource(key)

    resource.loader =
        loader
}


/* =========================================================
   ЕСТЬ ЛИ ГОТОВЫЕ ДАННЫЕ
   ========================================================= */

export function hasResource(
    key
) {
    return Boolean(
        resources.get(key)
            ?.hasData
    )
}


/* =========================================================
   ИДЁТ ЛИ СЕЙЧАС ЗАПРОС
   ========================================================= */

export function isResourceLoading(
    key
) {
    return Boolean(
        resources.get(key)
            ?.request
    )
}


/* =========================================================
   ПОЛУЧИТЬ КЭШ БЕЗ ЗАПРОСА
   ========================================================= */

export function peekResource(
    key
) {
    const resource =
        resources.get(key)

    if (
        !resource?.hasData
    ) {
        return null
    }

    return resource.data
}


/* =========================================================
   СОХРАНИТЬ RESOURCE
   ========================================================= */

export function setResource(
    key,
    data
) {
    const resource =
        ensureResource(key)

    resource.data =
        data

    resource.hasData =
        true

    return data
}


/* =========================================================
   INVALIDATE
   ========================================================= */

export function invalidateResource(
    key
) {
    const resource =
        resources.get(key)

    if (!resource) {
        return
    }

    resource.data =
        null

    resource.hasData =
        false
}


/* =========================================================
   ПОЛУЧИТЬ RESOURCE
   ========================================================= */

export async function getResource(
    key,
    {
        force = false
    } = {}
) {
    const resource =
        ensureResource(key)


    /*
     * Есть готовые данные и force не нужен.
     * Возвращаем мгновенно.
     */

    if (
        !force &&
        resource.hasData
    ) {
        return resource.data
    }


    /*
     * Запрос уже выполняется.
     *
     * Второй такой же запрос не создаём.
     */

    if (resource.request) {

        /*
         * Но если force=true,
         * значит данные изменились,
         * пока старый запрос ещё выполняется.
         *
         * Запоминаем, что после его завершения
         * нужен ещё один новый запрос.
         */

        if (force) {
            resource.refreshQueued =
                true
        }

        return resource.request
    }


    /*
     * Без loader загрузить ресурс невозможно.
     */

    if (
        typeof resource.loader !==
        "function"
    ) {
        throw new Error(
            `Resource Cache: loader для "${key}" не зарегистрирован`
        )
    }


    /*
     * Создаём единственный запрос.
     */

    const request =
        Promise
            .resolve()
            .then(
                () =>
                    resource.loader()
            )
            .then(
                (data) => {
                    setResource(
                        key,
                        data
                    )

                    return data
                }
            )
            .finally(
                () => {

                    /*
                     * Очищаем request только если
                     * это всё ещё именно текущий request.
                     */

                    if (
                        resource.request ===
                        request
                    ) {
                        resource.request =
                            null
                    }


                    /*
                     * Пока запрос выполнялся,
                     * могло произойти изменение данных.
                     *
                     * Например:
                     *
                     * Profile впервые грузится
                     * ↓
                     * пользователь подтверждает привычку
                     * ↓
                     * старый Profile request заканчивается
                     * ↓
                     * автоматически делаем свежий request
                     */

                    if (
                        resource.refreshQueued
                    ) {
                        resource.refreshQueued =
                            false

                        queueMicrotask(
                            () => {
                                void getResource(
                                    key,
                                    {
                                        force: true
                                    }
                                )
                                    .catch(
                                        (error) => {
                                            console.warn(
                                                `Resource Cache: отложенное обновление "${key}" не удалось`,
                                                error
                                            )
                                        }
                                    )
                            }
                        )
                    }
                }
            )

    resource.request =
        request

    return request
}


/* =========================================================
   ПРИНУДИТЕЛЬНО ОБНОВИТЬ
   ========================================================= */

export function refreshResource(
    key
) {
    return getResource(
        key,
        {
            force: true
        }
    )
}


/* =========================================================
   ОБНОВИТЬ ИСПОЛЬЗОВАННЫЕ RESOURCE

   ВАЖНО:

   Обновляем ресурс если:

   1. у него уже есть готовый кэш;

   ИЛИ

   2. он прямо сейчас впервые загружается.

   Если ресурс вообще никогда не использовался —
   API-запрос не создаём.
   ========================================================= */

export async function refreshCachedResources(
    keys = []
) {
    const uniqueKeys = [
        ...new Set(keys)
    ]


    const keysToRefresh =
        uniqueKeys.filter(
            (key) => {
                const resource =
                    resources.get(key)

                if (!resource) {
                    return false
                }

                return Boolean(
                    resource.hasData ||
                    resource.request
                )
            }
        )


    if (!keysToRefresh.length) {
        return []
    }


    return Promise.allSettled(
        keysToRefresh.map(
            (key) =>
                refreshResource(key)
        )
    )
}