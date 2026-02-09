import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for getting the demo user and generating them a Tide invite URL, when Login button
 * is clicked on the login screen of the client side.
 * @returns {Promise<Object>} - response status for client side to use in initialiser
 */
export async function GET(){
    // Shared varible from /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch token here, because Login screen on client side gets this endpoint
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Get the user object to check if the demo user is already linked to a Tide account
        const demoUserResult = await apiService.getDemoUser(baseURL, realm, masterToken);
        const demoUser = demoUserResult.body;

        console.log('[inviteUser] Demo user data:', {
            id: demoUser.id,
            username: demoUser.username,
            hasAttributes: !!demoUser.attributes,
            attributes: demoUser.attributes,
            hasVuid: !!(demoUser.attributes && demoUser.attributes.vuid)
        });

        // Check if demo user is already linked, if so don't generate a URL and proceed with login
        if (demoUser.attributes && demoUser.attributes.vuid && demoUser.attributes.vuid.length > 0){
            console.log('[inviteUser] User already linked with vuid:', demoUser.attributes.vuid);
            return new Response(JSON.stringify({ok: true}), {status: 200});
        }
        else {
            const demoUserID = demoUserResult.body.id;

            // Generate an invite link to return to the client for the user to link their Tide account
            console.log('[inviteUser] Generating invite for user:', demoUserID);
            const createInviteResult = await apiService.createTideInvite(baseURL, realm, demoUserID, masterToken);
            console.log('[inviteUser] Generated invite URL:', createInviteResult.body);

            return new Response(JSON.stringify({ok: true, inviteURL: createInviteResult.body}), {status: createInviteResult.status});
        }
    }
    catch (error) {
        console.error('[inviteUser] Error:', error);
        return new Response(JSON.stringify({ok: false, error: "[inviteUser Endpoint] " + error.message}), {status: 500});
    }
}
