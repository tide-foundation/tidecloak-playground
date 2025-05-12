// This performs a server-side JWT validation to secure user access
import { jwtVerify, createLocalJWKSet } from "jose";
import kcData from "/tidecloak.json";

const jwkData = kcData.jwk;
if (!jwkData) { 
  console.error("[TideJWT] No keys were found in tidecloak.json. Did you forget to download the client adaptor from TideCloak?"); 
}
const JWKS = jwkData ? createLocalJWKSet(jwkData) : null;

export async function verifyTideCloakToken(token , AllowedRole) {

  try {
    // Verify there's a token at all
    if (!token) {
      throw "No token found";
    }

    const issSlash = kcData['auth-server-url']?.endsWith('/') ? '' : '/';
    const thisIssuer = kcData['auth-server-url']+issSlash+"realms/"+kcData['realm'];
    // Verify token signature with TideCloak's JWKS
    const { payload  } = await jwtVerify(token, JWKS, {
      // Enforce issuer check here
      issuer: thisIssuer,
    });

	// Enforce Keycloak's Authorized Party (client) verification here
    if ( payload.azp != kcData['resource']) {
      throw "AZP attribute failed: '"+ kcData['resource'] +"' isn't '" + payload.azp + "'"
    }
	
	// Enforce Keycloak's realm roles verification here
    if ( AllowedRole!='' && !payload.realm_access.roles.includes(AllowedRole) ) {
      throw "Role match failed: '"+ payload.realm_access.roles +"' has no '" + AllowedRole + "'"
    }
	
    return payload;
  } catch (err) {
      console.error("[TideJWT] Token verification failed:", err);
    return null;
  }
}
