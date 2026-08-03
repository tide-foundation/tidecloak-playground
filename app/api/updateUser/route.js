import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * Store an updated user representation server-side with the master token and
 * drain the change-request inbox so the captured SET_USER_ATTRIBUTE change
 * request commits immediately. Under the new IGA browser users hold no
 * realm-management roles (MF2 guard forbids them on the default-role
 * composite), so the PUT and the approve both have to happen here.
 * @returns {Promise<Object>} - status response
 */
export async function POST(request){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    let user;
    try {
        ({ user } = await request.json());
    } catch {
        user = null;
    }
    if (!user?.id) {
        return new Response(JSON.stringify({ok: false, error: "[updateUser Endpoint] Body must be JSON {user} with user.id set."}), {status: 400});
    }

    try {
        const masterToken = await apiService.getMasterToken(baseURL);
        await apiService.updateUser(baseURL, realm, user, masterToken);
        return new Response(JSON.stringify({ok: true}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[updateUser Endpoint] " + error.message}), {status: 500});
    }
}
