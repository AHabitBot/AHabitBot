export function renderProfileReferralPage(
    root
) {
    root.innerHTML = `
        <section class="profile-page">

            <header class="profile-header">

                <button
                    type="button"
                    data-profile-back
                    aria-label="Назад"
                >
                    ←
                </button>

                <h1 class="profile-header__title">
                    Пригласить друга
                </h1>

            </header>

        </section>
    `
}