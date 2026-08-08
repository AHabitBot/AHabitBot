import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileSupportPage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Поддержка"
            )}

        </section>
    `
}