import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * Check server-side (master token) whether the logged-in user (resolved by
 * vuid) already holds the tide-realm-admin client role. The admin page needs
 * this before the visitor has become an admin, and under the new IGA browser
 * users hold no view-users/view-clients (MF2 guard).
 * @returns {Promise<Object>} - {isAdmin, user}
 */
export async function GET(request){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    const vuid = new URL(request.url).searchParams.get("vuid");
    if (!vuid) {
        return new Response(JSON.stringify({ok: false, error: "[checkAdminRole Endpoint] Missing vuid query parameter."}), {status: 400});
    }

    try {
        const masterToken = await apiService.getMasterToken(baseURL);
        const user = await apiService.getUserByVuid(baseURL, realm, vuid, masterToken);
        if (!user) {
            return new Response(JSON.stringify({ok: true, isAdmin: false, user: null}), {status: 200});
        }
        const realmManagement = await apiService.getRealmManagement(baseURL, realm, masterToken);
        const isAdmin = await apiService.userHasClientRole(
            baseURL, realm, user.id, realmManagement.body.id, "tide-realm-admin", masterToken);
        return new Response(JSON.stringify({ok: true, isAdmin, user}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[checkAdminRole Endpoint] " + error.message}), {status: 500});
    }
}
