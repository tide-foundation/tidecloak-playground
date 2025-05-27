import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for deleting the realm on error within initialization.
 * Deletion of IDP is required before deletion of the realm.
 * @return {Promse<Object>} - status response object for client side to use
 */
export async function GET(){

    // Shared backend variables from /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    // Need to delete IDP first, before deletion of realm.
    try {
        const result = await apiService.deleteIDP(baseURL, realm, masterToken);

        if (result.status === 204){
            // Account for no content
            return new Response(null, {status: result.status});
        }
        return new Response(JSON.stringify({...result}), {status: result.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[deleteIDP Endpoint] " + error.message}), {status: 500});
    }
}