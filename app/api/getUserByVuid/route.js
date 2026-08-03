import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * Resolve the logged-in user by their Tide vuid attribute, server-side with the
 * master token. Under the new IGA the realm default-role composite must not
 * carry realm-management roles (MF2 guard), so browser users no longer hold
 * view-users and cannot list users themselves.
 * @returns {Promise<Object>} - {user} (null when no match yet - caller retries)
 */
export async function GET(request){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    const vuid = new URL(request.url).searchParams.get("vuid");
    if (!vuid) {
        return new Response(JSON.stringify({ok: false, error: "[getUserByVuid Endpoint] Missing vuid query parameter."}), {status: 400});
    }

    try {
        const masterToken = await apiService.getMasterToken(baseURL);
        const user = await apiService.getUserByVuid(baseURL, realm, vuid, masterToken);
        return new Response(JSON.stringify({ok: true, user}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getUserByVuid Endpoint] " + error.message}), {status: 500});
    }
}
