import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for getting the demo user and assigning them the default realm roles for the initializer.
 * It fetches the demo user's ID and assign them ("demouser") the read and write permission for date of birth, and the write permission for credit card,
 * which goes through IGA for the change request to be signed and committed. Note that credit card isn't be readable by default.
 * @returns {Promise<Object>} - response object based on whether assigning the admin role was successful.
 */
export async function GET(){
    // Shared variables at /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch the token here, so that this endpoint can be used outside of the initialiser too.
    const masterToken = await apiService.getMasterToken(baseURL);

    // Minimal realm roles to be assigned to demo user
    // These roles need to be assigned manually here instead of importing under the default composite role, else they can't be removed
    const assignRealmRoles = [
        "_tide_dob.selfencrypt",
        "_tide_dob.selfdecrypt",
        "_tide_cc.selfencrypt",
    ];

    try {
        // Get default user object for "demouser"
        const demoUserResult = await apiService.getDemoUser(baseURL, realm, masterToken);
        const userID = demoUserResult.body.id;
        // Fetch all realm roles that can be assigned to the demo user
        const availableRealmRolesResult = await apiService.getAvailableRealmRoles(baseURL, realm, userID, masterToken);
        const availableRealmRoles = availableRealmRolesResult.body;

        // Find object representation for each of the three default realm roles and assign them to the demo user.
        // This creates three user change requests in IGA
        for (let i = 0; i < assignRealmRoles.length; i++) {
            const roleName = assignRealmRoles[i];
            const assignRole = availableRealmRoles.find((role) => role.name === roleName);
            const assignRoleResult = await apiService.assignRealmRole(baseURL, realm, userID, assignRole, masterToken);
        }

        // Drain the PENDING change-requests the role assignments created via the
        // native iga-core inbox. In firstAdmin / threshold-1 mode (no Tide admin
        // granted yet) /approve records AND auto-commits. Once a Tide admin
        // exists each request would instead need sequential enclave approval.
        await apiService.drainChangeRequests(baseURL, realm);

        return new Response(JSON.stringify({ok: true}), {status: 200});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[assignRealmRoles Endpoint] " + error.message}), {status: 500})
    }
}
