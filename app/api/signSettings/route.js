
import configs from "../apiConfigs";
import settings from "/test-realm.json";
import apiService from "../apiService";

/**
 * This custom Tide endpoint is only for signing the new IDP Settings
 * Should be called for changes to the IDP settings, else IGA processes like Review/Approve and Commit will error (string s empty error)
 * @param {Object} request - master token in the authorization header 
 * @returns {Promise<Object>} - status response for client side to use
 */
export async function GET(){

    const baseURL = configs.baseURL;
    const realm = settings.realm;
    
    // Get its own master token as client side also needs this endpoint
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