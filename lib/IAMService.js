import TideCloak from "tidecloak-js"

let _tc = null;
 
async function getTideCloakClient() {
  if (!_tc) {
    const res = await fetch("/api/tidecloakConfig");
    const kcData = await res.json();
    if ( Object.keys(kcData).length == 0 ) {
      console.log("[getTideCloakClient] tidecloak.json is empty. Web admin must download client adaptor from TideCloak or initialise on Login screen."); // Thrown to catch
    } else {
      _tc = new TideCloak({
        url: kcData['auth-server-url'],
        realm: kcData['realm'],
        clientId: kcData['resource'],
        vendorId: kcData['vendorId'],
        homeOrkUrl: kcData['homeOrkUrl']
      });
    }
  }
  return _tc;
}

const updateIAMToken = async () => {
  const tidecloak = await getTideCloakClient();
  if (tidecloak) { await tidecloak.updateToken(300).then((refreshed) => {
    if (refreshed) {
      console.debug('[updateIAMToken] Token refreshed: '+ Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
      if (! typeof window === "undefined" ) { 
        document.cookie = `kcToken=${tidecloak.token}; path=/;`; 
      };
    } else {
      console.debug('[updateIAMToken] Token not refreshed, valid for '
        + Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
    }
  }).catch((err) => {
    console.error('[updateIAMToken] Failed to refresh token', err);
    throw err;
  });}
}

const initIAM = async (onReadyCallback) => {
  const tidecloak = await getTideCloakClient();
  if (typeof window === "undefined") {
    // We are on the server, do nothing
    return;
  }

  if (!tidecloak) {  return; }
  tidecloak.onTokenExpired = async () => { await updateIAMToken() };
  if (!tidecloak.didInitialize) {
    tidecloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
      pkceMethod: "S256",
    })
    .then((authenticated) => {
      // If authenticated, store the token in a cookie so the middleware can read it.
      if (authenticated && tidecloak.token) {
        document.cookie = `kcToken=${tidecloak.token}; path=/;`;
      }

      if (onReadyCallback) {
        onReadyCallback(authenticated);
      }
    })
    .catch((err) => console.error("TideCloak init err:", err));
  }else{
    if (onReadyCallback) {
      onReadyCallback(true);
    }
  }

};

const doLogin = async () => {
  const tidecloak = await getTideCloakClient();
  if (tidecloak) { tidecloak.login({redirectUri: window.location.origin + "/auth/redirect"}); }
};

const doEncrypt = async (d) => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return await tidecloak.encrypt(d);
}
const doDecrypt = async (d) => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return await tidecloak.decrypt(d);
}

const doLogout = async () => {
  const tidecloak = await getTideCloakClient();
  // Clear the cookie so the server no longer sees the old token
  document.cookie = "kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (tidecloak) { tidecloak.logout({redirectUri: window.location.origin + "/auth/redirect" }); }
};

const isLoggedIn = async () => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return !!tidecloak.token;
};

const getToken = async () => {
  const tidecloak = await getTideCloakClient();
  if (tidecloak) {
    const tokenExp = getTokenExp();
    if ( tokenExp < 3 ) {
      try {
        await updateIAMToken();
        console.debug('Refreshed the token');
      } catch (error) {
        console.error('Failed to refresh the token', error);
        tidecloak.logout();
        return null;
      }
    }
    return tidecloak.token ?? null;
  }
  return null;
};

const getName = async () => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return tidecloak.tokenParsed?.preferred_username;
};

const getTokenExp = async () => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return Math.round(tidecloak.tokenParsed?.exp + tidecloak.timeSkew - new Date().getTime() / 1000);
};

const hasOneRole = async (role) => {
  const tidecloak = await getTideCloakClient();
  if (!tidecloak) {  return null; }
  return tidecloak.hasRealmRole(role);
};

// Get any value from the token (used for vuid)
const getValueFromToken = async (key) => {
  const keycloak = await getTideCloakClient();
  return keycloak.tokenParsed[key] ?? null
}

// Force Token to update immediately (used on client side only)
const updateToken = async () => {
  const tidecloak = await getTideCloakClient();
  
  // Clear the cookie "/" is the path the cookie was set at (the root) and is valid for every page.
  document.cookie = "kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  
  if (tidecloak) { await tidecloak.updateToken(-1).then((refreshed) => {
    
    if (refreshed) {
      console.debug('[updateIAMToken] Token refreshed: '+ Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
      
      // Set the cookie again
      document.cookie = `kcToken=${tidecloak.token}; path=/;`; 
      
    } else {
      console.debug('[updateIAMToken] Token not refreshed, valid for '
        + Math.round(tidecloak.tokenParsed.exp + tidecloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
    }
  }).catch((err) => {
    console.error('[updateIAMToken] Failed to refresh token', err);
    throw err;
  });}
}

const IAMService = {
  getTideCloakClient,
  initIAM,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  getName,
  hasOneRole,
  getTokenExp,
  doEncrypt,
  doDecrypt,
  getValueFromToken,
  updateToken
};

export default IAMService;
