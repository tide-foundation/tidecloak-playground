import configs from "../apiConfigs";                
import settings from "../../../test-realm.json";   
import apiService from "../apiService";          


/**
 * This endpoint is only for creating the initial realm for the initializer of the client side.
 * Uses the settings provided in test-realm.json as an import.
 * @returns {Promise<Object>} - response status with message for client side to use
 */
export async function GET(){
    // Shared variable from /api/apiConfigs.js
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Create the realm, importing the settings from test-realm.json
        const result = await apiService.createDefaultRealm(baseURL, settings, masterToken);

        return new Response(JSON.stringify({...result}), {status: result.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[createRealm Endpoint] " + error.message}), {status: 500});
    }
}