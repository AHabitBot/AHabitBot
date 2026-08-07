/* =========================================================
   PROFILE V2 — ГЛАВНАЯ СТРАНИЦА
   ========================================================= */


/* =========================================================
   ОТКРЫТЬ ПРОФИЛЬ
   ========================================================= */

export function openProfilePage(root) {
    if (!root) {
        console.error(
            "Profile: не найден корневой контейнер"
        )

        return
    }

    renderProfilePage(root)
}


/* =========================================================
   РЕНДЕР ГЛАВНОЙ СТРАНИЦЫ ПРОФИЛЯ
   ========================================================= */

function renderProfilePage(root) {
    root.innerHTML = `
        <section class="profile-page">

            <header class="profile-header">
                <h1 class="profile-header__title">
                    Профиль
                </h1>
            </header>

        </section>
    `
}