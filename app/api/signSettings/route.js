
import configs from "../apiConfigs";
import settings from "/test-realm.json";
import apiService from "../apiService";

/**
 * This custom Tide endpoint is only for signing the new IDP Settings
 * Should be called for changes to the IDP settings, else IGA processes like Review/Approve and Commit will error (string s empty error)
 * @param {Object} request - master token in the authorization header 
 * @returns {Promise<Object>} - status response for client side to use
 */
export async function GET(request){

    const baseURL = configs.baseURL;
    const realm = settings.realm;

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];

    try {
        // Sign the new IDP settings
        const signSettingsResult = await apiService.signSettings(baseURL, realm, masterToken);
        
        return new Response(JSON.stringify({ok: true}), {status: signSettingsResult.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[signSettings Endpoint] " + error.message}), {status: 500})
    }
}