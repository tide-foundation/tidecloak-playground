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
        const getMasterTokenFetch = await apiService.getMasterToken(baseURL);
        const getMasterTokenResp = await getMasterTokenFetch.json();

        if (!getMasterTokenResp.ok){
            return new Response(JSON.stringify(getMasterTokenResp));
        }

        const masterToken = getMasterTokenResp.body;

        const UsersChangeRequestsFetch = await apiService.getUsersChangeRequests(baseURL, realm, masterToken);
        const UsersChangeRequestsResp = await UsersChangeRequestsFetch.json();

        if (!UsersChangeRequestsResp.ok){
            return new Response(JSON.stringify(UsersChangeRequestsResp)); 
        }

        const usersChangeRequests = UsersChangeRequestsResp.body;
        
        // Sign the change request to approve
        const signChangeReqFetch = await apiService.signChangeRequest(baseURL, realm, usersChangeRequests, masterToken);
        const signChangeReqResp = await signChangeReqFetch.json();

        if (!signChangeReqResp.ok){
            return new Response(JSON.stringify(signChangeReqResp)); 
        }

        // Commit the signed change request for the user to have tide-realm-admin role
        const commitChangeReqFetch = await apiService.commitChangeRequest(baseURL, realm, usersChangeRequests, masterToken);
        const commitChangeReqResp = await commitChangeReqFetch.json();

        if (!commitChangeReqResp.ok){
            return new Response(JSON.stringify(commitChangeReqResp)); 
        }

        return new Response(JSON.stringify({ok: true, status: commitChangeReqResp.status}));

    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[commitAdminRole Endpoint]" + error.message}), {status: 500})
    }
}