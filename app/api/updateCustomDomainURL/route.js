import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is for updating the Tide IDP settings to contain the custom domain URL used in the Tide Enclave for IGA.
 * @returns {Promise<Object>} - response status for client side to use
 */
export async function GET(){

    const realm = configs.realm;
    const baseURL = configs.baseURL;
    const customURL = configs.customURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    
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
        return new Response(JSON.stringify({ok: false, error: `[updateCustomDomainURL Endpoint] ` + error.message}), {status: 500})
    } 
}
