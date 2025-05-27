import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching the token of the master realm from the client side. Note that the client side can't fetch the token without using
 * a backend endpoint like this.
 * @returns {Promise<Object>} - status object with a master token attached in the "body" field.
 */
export async function GET(){
    // Shared variable from /api/apiConfigs.js
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