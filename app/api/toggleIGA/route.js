import configs from "../apiConfigs";
import apiService from "../apiService";
/**
 * This custom Tide endpoint is only for toggling IGA on after an IDP has been created.
 * @param {Object} request - contains the master token in the authorization header 
 * @returns {Promise<Object>} - response status for client side to use
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
        // Toggle IGA to be true and it should remain true for the Admin Console.
        const result = await apiService.toggleIGA(baseURL, realm, masterToken);

        return new Response(JSON.stringify({...result}), {status: result.status}); 
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[toggleIGA Endpoint] " + error.message}), {status: 500});
    }
}
