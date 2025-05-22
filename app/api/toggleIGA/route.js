import configs from "../apiConfigs";
import apiService from "../apiService";
/**
 * This custom Tide endpoint is only for toggling IGA on after an IDP has been created.
 * @returns {Promise<Object>} - response status for client side to use
 */
export async function GET(){

    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Toggle IGA to be true and it should remain true for the Admin Console.
        const result = await apiService.toggleIGA(baseURL, realm, masterToken);
        console.log(result);

        return new Response(JSON.stringify({...result}), {status: result.status}); 
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[toggleIGA Endpoint] " + error.message}), {status: 500});
    }
}
