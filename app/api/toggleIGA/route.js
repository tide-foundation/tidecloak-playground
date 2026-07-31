import configs from "../apiConfigs";
import apiService from "../apiService";
/**
 * This custom Tide endpoint is only for toggling IGA on after the Tide IDP has been created.
 * Should remain on forever after toggling for the purpose of this demo.
 * @returns {Promise<Object>} - response status object based on whether IGA was successfully toggled on.
 */
export async function GET(){
    // Shared variables in /api/apiConfigs.js
    const realm = configs.realm;
    const baseURL = configs.baseURL;

    // Fetch a master token with the default admin and password (set in the command for setting up keycloak) from the default keycloak admin-cli client
    const masterToken = await apiService.getMasterToken(baseURL);

    try {
        // The Tide enclave requires iga.attestor=tide to be stamped on the realm
        // BEFORE IGA is enabled. Fetch the realm representation, merge the
        // attribute in, and persist it, then toggle IGA on.
        const realmRep = (await apiService.getRealmRepresentation(baseURL, realm, masterToken)).body;
        realmRep.attributes = { ...(realmRep.attributes || {}), "iga.attestor": "tide" };
        await apiService.updateRealmRepresentation(baseURL, realm, realmRep, masterToken);

        // Toggle IGA to be true and it should remain true for the demo.
        const result = await apiService.toggleIGA(baseURL, realm, masterToken);

        // Drain the ADOPT change-requests raised by enabling IGA (firstAdmin
        // threshold-1 auto-commits on approve).
        await apiService.drainChangeRequests(baseURL, realm);

        return new Response(JSON.stringify({...result}), {status: result.status});
    }
    catch (error) {
        return new Response(JSON.stringify({ok: false, error: "[toggleIGA Endpoint] " + error.message}), {status: 500});
    }
}
