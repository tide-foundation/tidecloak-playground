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

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing or invalid token"}), {status: 400});
    }

    // To get the token without the leading "Bearer "
    const masterToken = authHeader.split(" ")[1];
  
    // Dummy users to create
    const users = [
        {username: "demouser", dob: "1980-01-01", cc: "4111111111111111"},
        {username: "testuser1", dob: "1990-02-02", cc: "378282246310005"},
        {username: "testuser2", dob: "2000-03-03", cc: "5555555555554444"},
        {username: "testuser3", dob: "2010-04-04", cc: "6011111111111117"},
        {username: "testuser4", dob: "2020-05-05", cc: "3530111333300000"},
    ] 

    try {
        // Create the users
        users.forEach(async (user) => {
            const createUserResult = await apiService.createUser(baseURL, realm, masterToken, user.username, user.dob, user.cc);
        })

        return new Response(JSON.stringify({ok: true}), {status: 201}); 
        
    } 
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[createUsers Endpoint] " + error.message}), {status: 500});
    }
}
