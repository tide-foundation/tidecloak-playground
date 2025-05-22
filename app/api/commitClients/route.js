import configs from "../apiConfigs";
import settings from "/test-realm.json";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching, approving and committing the clients (IGA) as part of the initialisation process
 * @returns {Promise<Object>} - status response to be handled on client side
 */
export async function GET(){

    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);
    
    try {
        // Fetch the change requests to for signage upon approval
        const clientChangeRequestsFetch = await apiService.getClientsChangeRequests(baseURL, realm, masterToken);
        const clientsChangeRequests = clientChangeRequestsFetch.body;

        for (let i = 0; i < clientsChangeRequests.length; i++) {
            const changeRequest = clientsChangeRequests[i];
        
            const approveResult = await apiService.signChangeRequest(baseURL, realm, changeRequest, masterToken);
            const commitResult = await apiService.commitChangeRequest(baseURL, realm, changeRequest, masterToken);
        }

        return new Response(JSON.stringify({ok: true}), {status: 200});     
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[commitClients Endpoint] " + error.message}), {status: 500})
    }
}
