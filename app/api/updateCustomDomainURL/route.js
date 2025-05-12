import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is for updating the Tide IDP settings to contain the custom domain URL used in the Tide Enclave for IGA.
 * @param {Object} request - contains the master token in the authorization header 
 * @returns {Promise<Object>} - response status for client side to use
 */
export async function GET(request){

    const realm = configs.realm;
    const baseURL = configs.baseURL;
    const customURL = configs.customURL;

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];
    
    // Get IDP settings to update
    const getIDPSettingsResult = await apiService.getIDPSettings(baseURL, realm, masterToken);
    const settings = getIDPSettingsResult.body;

    settings.config["CustomAdminUIDomain"] = `${customURL}`;

    // Update the IDP settings using a new IDP settings object with the Custom Domain URL (provided in apiConfigs) for the enclave
    // Custom Domain URL should point to the base URL of the Admin Console
    try {
        const updateIDPSettingsResult = await apiService.updateIDPSettings(baseURL, realm, settings, masterToken);

        if (updateIDPSettingsResult.status === 204) {
            return new Response(JSON.stringify(null, {status: updateIDPSettingsResult.status})); 
        }
        else {
            return new Response(JSON.stringify({ok: true}), {status: updateIDPSettingsResult.status}); 
        }
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: `[updateCustomDomainURL Endpoint]` + error.message}), {status: 500})
    } 
}
