import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileAchievementsPage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Достижения"
            )}

        </section>
    `
}