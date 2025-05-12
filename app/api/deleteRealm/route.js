
import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for deleting the realm on error within initialisation.
 * This endpoint should be called after the deleteIDP endpoint as a realm can't be deleted whilst its IDP exists
 * @param {Object} request - contains master token in authorization header
 * @returns {Promise<Object>} - status response and custom message for the client side to use
 */
export async function GET(request){

    const realm = configs.realm;
    const baseURL = configs.baseURL;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];

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