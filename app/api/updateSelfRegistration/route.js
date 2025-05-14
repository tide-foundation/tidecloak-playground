import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * 
 * 
 *
 */
export async function GET(){

    const realm = configs.realm;
    const baseURL = configs.baseURL;


    // Get Master Token
    const masterToken = await apiService.getMasterToken(baseURL);
    
    try {
        // Turn off Self Registration
        const response = await apiService.updateSelfRegister(baseURL, realm, masterToken);

        return new Response(JSON.stringify({ok: true}), {status: response.status});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[updateSelfRegistration Endpoint] " + error.message}), {status: 500})
    } 
}
