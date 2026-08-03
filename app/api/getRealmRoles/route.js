import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * Fetch the demo's _tide_* realm role representations server-side with the
 * master token. The admin page needs them before the visitor has become an
 * admin, and under the new IGA browser users hold no view-realm (MF2 guard).
 * Restricted to _tide_-prefixed roles so this cannot be used as a generic
 * role-reading proxy.
 * @returns {Promise<Object>} - {roles: {name: representation}}
 */
export async function GET(request){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    const namesParam = new URL(request.url).searchParams.get("names") || "";
    const names = namesParam.split(",").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0 || names.some((n) => !n.startsWith("_tide_"))) {
        return new Response(JSON.stringify({ok: false, error: "[getRealmRoles Endpoint] Provide names as a comma list of _tide_* roles."}), {status: 400});
    }

    try {
        const masterToken = await apiService.getMasterToken(baseURL);
        const roles = {};
        for (const name of names) {
            roles[name] = await apiService.getRealmRoleByName(baseURL, realm, name, masterToken);
        }
        return new Response(JSON.stringify({ok: true, roles}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getRealmRoles Endpoint] " + error.message}), {status: 500});
    }
}
