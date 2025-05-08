import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * 
 */
export async function GET(){
    const baseURL = configs.baseURL;
    const realm = configs.realm;

    try {
        // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
        // Master Token is only needed to assign the user the tide-realm-admin role
        const masterToken = await apiService.getMasterToken(baseURL);

        const UsersChangeRequestsResult = await apiService.getUsersChangeRequests(baseURL, realm, masterToken);
        
        const usersChangeRequests = UsersChangeRequestsResult.body;
        
        // Sign the change request to approve
        const signChangeReqResult = await apiService.signChangeRequest(baseURL, realm, usersChangeRequests[0], masterToken);

        // Commit the signed change request for the user to have tide-realm-admin role
        const commitChangeReqResult = await apiService.commitChangeRequest(baseURL, realm, usersChangeRequests[0], masterToken);

        return new Response(JSON.stringify({ok: true}), {status: commitChangeReqResult.status});

    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[commitAdminRole Endpoint]" + error.message}), {status: 500});
    }
}