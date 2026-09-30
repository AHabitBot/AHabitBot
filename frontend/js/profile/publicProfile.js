import { fetchPublicProfile } from "./publicProfileApi.js";
import { renderProfileUserCard, renderProfileSectionHeader } from "./profileComponents.js";
import { renderProfileStatsPage } from "./stats/profileStats.js";
import { t } from "../../i18n/core/i18n.js";

export async function openPublicProfilePage(root, userId, { onBack = null } = {}) {
    if (!root || !userId) return;

    try {
        const profile = await fetchPublicProfile(userId);

        const headerHtml = `
            <div class="public-profile-top">
                ${renderProfileSectionHeader(t("profile.main.title"))}
                <div class="public-profile-card">
                    ${renderProfileUserCard(profile, { mode: "public" })}
                </div>
                <h2 class="public-profile-stats-title">
                    ${t("profile.stats.title")}
                </h2>
            </div>
        `;

        renderProfileStatsPage(root, { userId, headerHtml });

        root.querySelector("[data-profile-back]")?.addEventListener(
            "click",
            () => onBack?.()
        );
    } catch (error) {
        console.error("Public profile:", error);
        onBack?.();
    }
}
