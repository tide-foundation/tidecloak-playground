
import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for deleting the realm on error within initialization.
 * This endpoint should be called after the deleteIDP endpoint as a realm can't be deleted whilst its IDP exists
 * @returns {Promise<Object>} - status object with response based don deletion result
 */
export async function GET(){
    // Shared variable from /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    // Need to delete IDP first, before deletion of realm.
    try {
        const result = await apiService.deleteRealm(baseURL, realm, masterToken);
        
        if (result.status === 204){
            // Account for no content
            return new Response(null, {status: result.status}); 
        }
        else {
            return new Response(JSON.stringify({...result}), {status: result.status}); 
        }    
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[deleteRealm Endpoint] " + error.message}), {status: 500});
    }
}