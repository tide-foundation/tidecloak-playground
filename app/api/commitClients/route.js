import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * This endpoint is only for fetching, approving and committing the clients (IGA) as part of the initialisation process
 * @returns {Promise<Object>} - status response to be handled on client side
 */
export async function GET(){
    // Share variables at /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    try {
        // Drain the PENDING client change-requests via the native iga-core inbox.
        // drainChangeRequests loops list+approve until the inbox is empty and
        // refetches the (short-lived) master token each round, so the previous
        // manual token-refresh / per-request sign+commit dance is no longer
        // needed. In firstAdmin / threshold-1 mode /approve auto-commits.
        await apiService.drainChangeRequests(baseURL, realm);

        return new Response(JSON.stringify({ok: true}), {status: 200});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[commitClients Endpoint] " + error.message}), {status: 500})
    }
}
