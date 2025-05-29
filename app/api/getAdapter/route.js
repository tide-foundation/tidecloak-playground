import configs from "../apiConfigs";
import settings from "/test-realm.json";
import fs from "fs";
import path from "path";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching adapter configurations and writing to the empty tidecloak.json object for initialization.
 * This is the final step in initialization. If tidecloak.json is manually set back to an empty object, initialization should trigger again when on the Login screen.
 * @returns {Promise<Object>} - status reponse object based on whether the configurations were written.
 */
export async function GET(){
    // Shared variables from /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;
    // From /test-realm.json
    const clientName = settings.clients[0].clientId; 

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Get the client representation to fetch the adapter with the client ID
        const getClientIDResult = await apiService.getClientID(baseURL, realm, clientName, masterToken);
        const clientID = getClientIDResult.body;

        // Get the configurations to write
        const getClientAdapterResult= await apiService.getClientAdapter(baseURL, realm, clientID, masterToken);
        const configsString = getClientAdapterResult.body;
        
        // Write settings to the tidecloak.json file, else the file contains an empty JSON object
        const filePath = path.join(process.cwd(), "data", "tidecloak.json");
        fs.writeFile(filePath, configsString, (err) => {
            if (err) {
                throw new Error("[getAdapter Endpoint] Failed to write to tidecloak.json.");
            }
        });
        return new Response(JSON.stringify({ok: true, kcData: configsString}), {status: getClientAdapterResult.status}); 
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[getAdapter Endpoint] " + error.message}), {status: 500})
    }
}
