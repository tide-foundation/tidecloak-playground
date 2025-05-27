// This performs a server-side JWT validation to secure user access
import { jwtVerify, createLocalJWKSet } from "jose";

/**
 * Load and parse the latest TideCloak configuration via API (Edge Runtime compatible).
 */
async function loadKcData(origin) {
  try {
    const res = await fetch(`${origin}/api/tidecloakConfig`);
    if (!res.ok) {
      console.error("[TideJWT] Failed to fetch config, status:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[TideJWT] Error fetching config:", err);
    return null;
  }
}



export async function verifyTideCloakToken(origin, token, AllowedRole) {

  try {
    // Verify there's a token at all
    if (!token) {
      throw new Error("No token provided");
    }

    const kcData = await loadKcData(origin);
    if (!kcData) {
      throw new Error("Could not load tidecloak configuration");
    }

    const jwkData = kcData.jwk;
    if (!jwkData) {
      console.error(
        "[TideJWT] No JWKs found in tidecloak.json. Ensure client adapter is initialized."
      );
      return null;
    }

    const JWKS = jwkData ? createLocalJWKSet(jwkData) : null;

    const issSlash = kcData['auth-server-url']?.endsWith('/') ? '' : '/';
    const thisIssuer = kcData['auth-server-url'] + issSlash + "realms/" + kcData['realm'];
    // Verify token signature with TideCloak's JWKS
    const { payload } = await jwtVerify(token, JWKS, {
      // Enforce issuer check here
      issuer: thisIssuer,
    });

    // Enforce Keycloak's Authorized Party (client) verification here
    if (payload.azp != kcData['resource']) {
      throw "AZP attribute failed: '" + kcData['resource'] + "' isn't '" + payload.azp + "'"
    }

    // Enforce Keycloak's realm roles verification here
    if (AllowedRole != '' && !payload.realm_access.roles.includes(AllowedRole)) {
      throw "Role match failed: '" + payload.realm_access.roles + "' has no '" + AllowedRole + "'"
    }

    return payload;
  } catch (err) {
    console.error("[TideJWT] Token verification failed:", err);
    return null;
  }
}
