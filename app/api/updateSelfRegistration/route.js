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
        const result = await apiService.updateSelfRegister(baseURL, realm, masterToken);


        if (result.status === 204){
            // Account for no content
            return new Response(null, {status: result.status});
        }
        else {
            return new Response(JSON.stringify({...result}), {status: result.status});
        }
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[updateSelfRegistration Endpoint] " + error.message}), {status: 500})
    } 
}
