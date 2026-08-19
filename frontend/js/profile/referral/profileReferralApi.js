import {
    apiRequest,
} from "../../api/apiClient.js";


export async function getProfileReferral() {
    return await apiRequest(
        "/api/profile/referral",
        {
            method: "GET",
        }
    );
}