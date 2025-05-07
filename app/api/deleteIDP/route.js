import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for deleting the realm on error within initialisation.
 * Deletion of IDP is required before deletion of the realm.
 * @params {Object} request - contains the master token in authorization header
 * @return {Promse<Object>} - status responses for client side to use
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