import configs from "../apiConfigs";
import settings from "/test-realm.json";
import apiService from "../apiService";

/**
 * This endpoint is only for creating the initial realm for the admin console on initialisation for the client side.
 * Uses the settings provided in test-realm.json as an import.
 * @param {Object} request 
 * @returns {Promise<Object>} - response status with message for client side to use
 */
export async function GET(request){

    const baseURL = configs.baseURL;

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "[createRealm Endpoint] Unauthorized: Missing or invalid token"}), {status: 401});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];

    try {
        // Create the realm, importing the settings from test-realm.json
        const result = await apiService.createDefaultRealm(baseURL, settings, masterToken);

        return new Response(JSON.stringify({...result}), {status: result.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[createRealm Endpoint] " + error.message}), {status: 500});
    }
}