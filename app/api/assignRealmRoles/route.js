import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for getting the initial user and assigning them the Tide Admin Role for the initialiser
 * It fetches the one user's ID, realm-management client's ID, tide-realm-admin role ID and name to assign to that user
 * which goes through IGA for the change request to be signed and committed.
 * @returns {Promise<Object>} - response statuses based on whether assigning the admin role was successful.
 */
export async function GET(){
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // To get the token without the leading "Bearer "
    const masterToken = await apiService.getMasterToken(baseURL);
    
    // Minimal Realm Management client roles to be assigned to demo user
    // const assignClientRoles = [
    //     "view-users", "view-clients", "manage-users",
       
    // ];

    // Minimal realm roles to be assigned to demo user
    // These roles need to be assigned manually here instead of importing under the default composite role, else they can't be removed
    const assignRealmRoles = [
        "_tide_dob.selfencrypt",
        "_tide_dob.selfdecrypt",
        "_tide_cc.selfencrypt",
    ];

    try {
        // Get default user object "demouser"
        const demoUserResult = await apiService.getDemoUser(baseURL, realm, masterToken);
        const userID = demoUserResult.body.id;
        
        // const allUsers = await apiService.getUsers(baseURL, realm, masterToken);
        // console.log(allUsers);

        // Get clients to find the client ID for "realm management" client
        //const realmManagementResult = await apiService.getRealmManagement(baseURL, realm, masterToken);
        //const RMClientID = realmManagementResult.body.id;
        
        // const availableClientRolesResult = await apiService.getAvailableClientRoles(baseURL, realm, userID, RMClientID, masterToken);
        // const availableClientRoles = availableClientRolesResult.body;

        //Assign the client roles to the demo user
        // assignClientRoles.forEach(async (roleName) => {
        //     const assignRole = await availableClientRoles.find((role) => role.name === roleName);

        //     const assignRoleResult = await apiService.assignClientRole(baseURL, realm, userID, RMClientID, assignRole, masterToken);
        // })

        // for (let i = 0; i < assignClientRoles.length; i++) {
        //     const roleName = assignClientRoles[i];
        //     const assignRole = availableClientRoles.find((role) => role.name === roleName);
        //     const assignRoleResult = await apiService.assignClientRole(baseURL, realm, userID, RMClientID, assignRole, masterToken);
        // }

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
