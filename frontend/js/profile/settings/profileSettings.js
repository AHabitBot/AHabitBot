import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileSettingsPage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Данные и настройки"
            )}

        </section>
    `
}