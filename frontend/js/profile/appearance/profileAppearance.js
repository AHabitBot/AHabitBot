import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileAppearancePage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Внешний вид"
            )}

        </section>
    `
}