
import configs from "../apiConfigs";
import apiService from "../apiService";
import fs from "fs";
import path from "path";

/**
 * This custom Tide endpoint is only for signing the new IDP Settings each time there are major changes, or error will be thrown in the Tide Enclave.
 * Should be called for changes to the IDP settings, else IGA processes like Review/Approve and Commit will error.
 * @returns {Promise<Object>} - status response object based on signing was successful
 */
export async function GET(){
    // Read settings from tidecloak-demo-realm.json at runtime
    const settingsPath = path.join(process.cwd(), "tidecloak-demo-realm.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    // Shared variables from /api/apiConfigs.js
    const baseURL = configs.baseURL;
    const realm = settings.realm;
    
    // Get a new master token to avoid expiry
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Sign the new IDP settings
        const signSettingsResult = await apiService.signSettings(baseURL, realm, masterToken);
        
        return new Response(JSON.stringify({ok: true}), {status: signSettingsResult.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[signSettings Endpoint] " + error.message}), {status: 500})
    }
}