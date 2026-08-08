import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileStatsPage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Игровые показатели"
            )}

        </section>
    `
}