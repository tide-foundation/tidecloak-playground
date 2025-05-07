import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for getting the initial user and assigning them the Tide Admin Role for the initialiser
 * It fetches the one user's ID, realm-management client's ID, tide-realm-admin role ID and name to assign to that user
 * which goes through IGA for the change request to be signed and committed.
 * @param {Object} request - contains the masterToken in the headers
 * @returns {Promise<Object>} - response statuses based on whether assigning the admin role was successful.
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
    
    // Minimal client roles to be assigned to demo user
    const assignClientRoles = [
        "view-users", "view-clients", "manage-users",
       
    ];

    // Minimal realm roles to be assigned to demo user
    const assignRealmRoles = [
        "_tide_dob.selfencrypt", "_tide_dob.selfdecrypt", "_tide_dob.read", "_tide_dob.write",
        "_tide_cc.selfencrypt", "_tide_cc.selfdecrypt", "_tide_cc.read", "_tide_cc.write",
    ];

    try {
        // Get default user object "demouser"
        const defaultUserResult = await apiService.getDefaultUser(baseURL, realm, masterToken);
        const userID = defaultUserResult.body.id;
        

        // Get clients to find the client ID for "realm management" client
        const realmManagementResult = await apiService.getRealmManagement(baseURL, realm, masterToken);
        const RMClientID = realmManagementResult.body.id;
        
        const availableClientRolesResult = await apiService.getAvailableClientRoles(baseURL, realm, userID, RMClientID, masterToken);
        const availableClientRoles = availableClientRolesResult.body;

        //Assign the client roles to the demo user
        // assignClientRoles.forEach(async (roleName) => {
        //     const assignRole = await availableClientRoles.find((role) => role.name === roleName);

        //     const assignRoleResult = await apiService.assignClientRole(baseURL, realm, userID, RMClientID, assignRole, masterToken);
        // })

        for (let i = 0; i < assignClientRoles.length; i++) {
            const roleName = assignClientRoles[i];
            const assignRole = availableClientRoles.find((role) => role.name === roleName);
            const assignRoleResult = await apiService.assignClientRole(baseURL, realm, userID, RMClientID, assignRole, masterToken);
        }

        const availableRealmRolesResult = await apiService.getAvailableRealmRoles(baseURL, realm, userID, masterToken);
        const availableRealmRoles = availableRealmRolesResult.body;

        // Assign the realm roles to the demo user
        // assignRealmRoles.forEach(async (roleName) => {
        //     const assignRole = await availableRealmRoles.find((role) => role.name === roleName);

        //     const assignRoleResult = await apiService.assignRealmRole(baseURL, realm, userID, assignRole, masterToken);
        // })

        for (let i = 0; i < assignRealmRoles.length; i++) {
            const roleName = assignRealmRoles[i];
            const assignRole = availableRealmRoles.find((role) => role.name === roleName);
            const assignRoleResult = await apiService.assignRealmRole(baseURL, realm, userID, assignRole, masterToken);
        }

        // Get the change request for assigning the role to the user
        const usersChangeRequestsResults = await apiService.getUsersChangeRequests(baseURL, realm, masterToken);
        const usersChangeRequests = usersChangeRequestsResults.body;

        // Approve and Commit each role for the user
        // usersChangeRequests.forEach(async (changeRequest) => {
        //     // Sign the change request to approve
        //     const signChangeRequestResult = await apiService.signChangeRequest(baseURL, realm, changeRequest, masterToken);
            
        //     // Commit the signed change request for the role
        //     const commitChangeRequestResult = await apiService.commitChangeRequest(baseURL, realm, changeRequest, masterToken);

        // })

        for (let i = 0; i < usersChangeRequests.length; i++) {
            const changeRequest = usersChangeRequests[i];
        
            // Sign the change request to approve
            const signChangeRequestResult = await apiService.signChangeRequest(baseURL, realm, changeRequest, masterToken);
            
            // Commit the signed change request for the role
            const commitChangeRequestResult = await apiService.commitChangeRequest(baseURL, realm, changeRequest, masterToken);
        }

        return new Response(JSON.stringify({ok: true}), {status: 200}); 
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[assignRealmRoles Endpoint] " + error.message}), {status: 500})
    }
}
