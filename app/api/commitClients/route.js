import configs from "../apiConfigs";
import settings from "/test-realm.json";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching, approving and committing the client (IGA) as part of the initialisation process
 * @param {Object} request - with the master token in the header
 * @returns {Promise<Object>} - status response to be handled on client side
 */
export async function GET(request){

    const realm = configs.realm;
    const baseURL = configs.baseURL;
    

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];
    
    try {
        // Fetch the change requests to for signage upon approval
        const clientChangeRequestsFetch = await apiService.getClientsChangeRequests(baseURL, realm, masterToken);
        const clientsChangeRequests = clientChangeRequestsFetch.body;

        // clientsChangeRequests.forEach(async (changeRequest) => {
        //     const approveResult = await apiService.signChangeRequest(baseURL, realm, changeRequest, masterToken);

        //     const commitResult = await apiService.commitChangeRequest(baseURL, realm, changeRequest, masterToken);
        // })
        for (let i = 0; i < clientsChangeRequests.length; i++) {
            const changeRequest = clientsChangeRequests[i];
        
            const approveResult = await apiService.signChangeRequest(baseURL, realm, changeRequest, masterToken);
            const commitResult = await apiService.commitChangeRequest(baseURL, realm, changeRequest, masterToken);
        }

        //return new Response(JSON.stringify({ok: true, status: commitClientResp.status, statusText: "Approving & Committing Client: Complete!"}));     

        return new Response({ok: true});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[commitClients Endpoint] " + error.message}), {status: 500})
    }
}
