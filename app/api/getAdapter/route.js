import configs from "../apiConfigs";
import settings from "/test-realm.json";
import fs from "fs";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching adapter configurations and writing to the empty tidecloak.json object to access the administration console.
 * This is the final step in initialisation, and if tidecloak.json is empty, triggers the client side UI to display the fresh start process again.
 * @param {Object} request - contains master token in the authorization header
 * @returns {Promise<Object>} - status reponse for client side to use
 */
export async function GET(request){

    const realm = configs.realm;
    const baseURL = configs.baseURL;
    const clientName = settings.clients[0].clientId; 

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];

    try {
        // Get the client representation to fetch the adapter with the client ID
        const getClientIDResult = await apiService.getClientID(baseURL, realm, clientName, masterToken);
        const clientID = getClientIDResult.body;

        // Get the configurations to write
        const getClientAdapterResult= await apiService.getClientAdapter(baseURL, realm, clientID, masterToken);
        const configsString = getClientAdapterResult.body;
        
        // Write settings to the tidecloak.json file, else the file contains an empty JSON object
        fs.writeFile("tidecloak.json", configsString, (err) => {
            if (err) {
                throw new Error("[getAdapter Endpoint] Failed to write to tidecloak.json.");
            }
        });
        return new Response(JSON.stringify({ok: true}), {status: getClientAdapterResult.status}); 
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getAdapter Endpoint] " + error.message}), {status: 500})
    }
}
