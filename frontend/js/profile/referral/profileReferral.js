import {
    renderProfileSectionHeader
} from "../profileComponents.js"


export function renderProfileReferralPage(root) {
    root.innerHTML = `
        <section class="profile-page">

            ${renderProfileSectionHeader(
                "Пригласить друга"
            )}

        </section>
    `
}