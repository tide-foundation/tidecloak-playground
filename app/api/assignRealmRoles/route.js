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

        // Assign the three default realm roles to the demo user ONE AT A TIME,
        // draining the change-request inbox after each. Under IGA every role
        // POST parks a PENDING GRANT_ROLES change request on the user and any
        // further role POST on that user 409s (PENDING_CHANGE_REQUEST_CONFLICT)
        // until it resolves — batching in one POST hits the same conflict
        // against its own first change request, so assign-then-drain it is.
        for (let i = 0; i < assignRealmRoles.length; i++) {
            const roleName = assignRealmRoles[i];
            const assignRole = availableRealmRoles.find((role) => role.name === roleName);
            if (!assignRole) {
                throw new Error(`Realm role not available to assign: ${roleName}`);
            }
            await apiService.assignRealmRole(baseURL, realm, userID, assignRole, masterToken);
            await apiService.drainChangeRequests(baseURL, realm);
        }

        return new Response(JSON.stringify({ok: true}), {status: 200});
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[assignRealmRoles Endpoint] " + error.message}), {status: 500})
    }
}
