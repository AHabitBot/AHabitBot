import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileArchivePage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Архив привычек"
            )}

        </section>
    `
}