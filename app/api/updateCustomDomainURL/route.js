import configs from "../apiConfigs";
import apiService from "../apiService";

/**
 * GET /api/update
 * Updates the Tide IDP settings’ CustomAdminUIDomain to include
 * whatever query-string you pass in.
 */
export async function GET(request) {
  const { realm, baseURL, customURL: defaultCustomURL } = configs;

  // Pull any incoming query params off the request URL
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const customURL = qs ? `${defaultCustomURL}?${qs}` : defaultCustomURL;

  // 2) Fetch a master token
  const masterToken = await apiService.getMasterToken(baseURL);

  // Get current IDP settings
  const getRes = await apiService.getIDPSettings(baseURL, realm, masterToken);
  const settings = getRes.body;

  // Override the CustomAdminUIDomain
  settings.config["CustomAdminUIDomain"] = customURL;

    // Update the IDP settings using a new IDP settings object with the Custom Domain URL (provided in apiConfigs) for the enclave
    // Custom Domain URL should point to the base URL of the Admin Console
  try {
    const updateRes = await apiService.updateIDPSettings(baseURL, realm, settings, masterToken);

    if (updateRes.status === 204) {
      // No content on success
      return new Response(null, { status: 204 });
    } else {
      return new Response(JSON.stringify({ ok: true }), {
        status: updateRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: `[updateCustomDomainURL] ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
