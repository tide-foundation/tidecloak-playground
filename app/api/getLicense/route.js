import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for activating the IDP license with a default email using a custom Tide endpoint.
 * Called after the createRealm endpoint to prepare for IGA steps
 * @param {Object} request - contains master token in the authorization header
 * @returns {Promise<Object>} - status code and custom message for client side to use for initialisation. 
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

    try {
        // Activate the IDP with the default email
        const result = await apiService.activateIDPLicense(baseURL, realm, masterToken);

        if (result.status === 204){
            return new Response(null, {status: result.status})
        }
        else {
            return new Response(JSON.stringify({...result}), {status: result.status}); 
        }
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getLicense Endpoint] " + error.message}), {status: 500});
    }
}