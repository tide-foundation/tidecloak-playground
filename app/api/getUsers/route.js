import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * List the realm's users server-side with the master token, for the
 * Database-Leak Drill cards. Under the new IGA browser users hold no
 * realm-management roles (MF2 guard), so they cannot list users themselves.
 * @returns {Promise<Object>} - {users}
 */
export async function GET(){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    try {
        const masterToken = await apiService.getMasterToken(baseURL);
        const users = await apiService.listUsers(baseURL, realm, masterToken);
        return new Response(JSON.stringify({ok: true, users}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getUsers Endpoint] " + error.message}), {status: 500});
    }
}
