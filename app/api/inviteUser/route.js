import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for creating the user and providing them a URL to link their admin account to Tide on initialisation.
 * 
 * @param {Object} request - contains master token within the authorization header
 * @returns {Promise<Object>} - response status for client side to use in initialiser
 */
export async function GET(request){

    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // To get the token without the leading "Bearer "
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // Get the user object to get the ID
        const demoUserResult = await apiService.getDemoUser(baseURL, realm, masterToken);
        const demoUser = demoUserResult.body;

        if (demoUser.attributes.vuid){
            return new Response(JSON.stringify({ok: true}), {status: 200}); 
        }
        else {
            const demoUserID = demoUserResult.body.id;

            // Generate an invite link to return to the client for the user to link their Tide account
            const createInviteResult = await apiService.createTideInvite(baseURL, realm, demoUserID, masterToken);
            console.log(createInviteResult.body);

            return new Response(JSON.stringify({ok: true, inviteURL: createInviteResult.body}), {status: createInviteResult.status}); 
        }  
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[createUsers Endpoint] " + error.message}), {status: 500});
    }
}
