import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * // This endpoint is only for fetching the token for the master realm.
 * This endpoint is called before any other steps in the client side initialisation, as a master token is required 
 * @returns {Promise<Object>} - status response with a master token attached in the "body" field and a custom message
 */
export async function GET(){
    const baseURL = configs.baseURL;

    try {
        // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
        const masterToken = await apiService.getMasterToken(baseURL);

        return new Response(JSON.stringify({ok: true, body: masterToken}), {status: 200});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getMasterToken Endpoint] " + error.message}), {status: 500});
    }
}