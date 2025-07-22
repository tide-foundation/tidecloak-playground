import appService from "../../../lib/appService";
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
        const demoAttributes = await appService.getUserAttributes(baseURL, realm, demoUser.id, masterToken);
        demoUser.attributes = {...demoUser.attributes, ...demoAttributes}
        
        // Check if demo user is already linked, if so don't generate a URL and proceed with login
        if (demoUser.attributes.vuid?.[0]){
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
