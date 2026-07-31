import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * Called from the client's /admin page to elevate the demo user to the
 * "tide-realm-admin" client role.
 *
 * The whole flow runs server-side with the master token because a not-yet-admin
 * user has no permission to read/assign client roles with their own token (the
 * client-side attempt failed with "Could not resolve the realm-management
 * client or tide-realm-admin role"). Steps:
 *   1. find the demo user and the realm-management client
 *   2. assign the tide-realm-admin client role (creates an IGA change request)
 *   3. sign + commit that change request
 *
 * @returns {Promise<Object>} - response object based on whether elevating the
 *   demo user with Tide admin privileges was successful.
 */
export async function GET(){
    // Shared variables from /api/apiConfigs.js
    const baseURL = configs.baseURL;
    const realm = configs.realm;

    try {
        // Master Token is needed to read/assign the tide-realm-admin role and to
        // sign + commit the resulting change request.
        const masterToken = await apiService.getMasterToken(baseURL);

        // Resolve the demo user and the realm-management client that owns the role
        const demoUser = (await apiService.getDemoUser(baseURL, realm, masterToken)).body;
        const rmClient = (await apiService.getRealmManagement(baseURL, realm, masterToken)).body;
        if (!rmClient) {
            throw new Error("realm-management client not found.");
        }

        // Assign the tide-realm-admin role if it isn't already assigned. If it's
        // not in the user's "available" roles it's already assigned, so skip.
        const tideAdminRole = (await apiService.getTideRealmAdminRole(baseURL, realm, demoUser.id, rmClient.id, masterToken)).body;
        if (tideAdminRole) {
            await apiService.assignClientRole(baseURL, realm, demoUser.id, rmClient.id, tideAdminRole, masterToken);
        }

        // Drain the change request the assignment created (if any) via the
        // native iga-core inbox. With no Tide admin in the realm yet, IGA takes
        // it straight to committable (firstAdmin threshold-1 auto-commit).
        await apiService.drainChangeRequests(baseURL, realm);

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    catch (error) {
        return new Response(JSON.stringify({ ok: false, error: "[commitAdminRole Endpoint] " + error.message }), { status: 500 });
    }
}
