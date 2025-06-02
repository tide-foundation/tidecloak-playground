import TideCloak from "tidecloak-js";

/**
 * Singleton IAMService wrapping TideCloak client.
 * Call loadConfig() once in your AuthContext; loadConfig returns the adapter config so you can reuse it.
 * Register any event listeners *before* calling initIAM().
 */
class IAMService {
  constructor() {
    this._tc = null;
    this._config = {};
  }

  /**
   * Fetch config and instantiate TideCloak once.
   * @returns {object|null} The TideCloak adapter config
   */
  async loadConfig() {
    if (this._tc) return this._config;

    const res = await fetch("/api/tidecloakConfig");
    const kcData = await res.json();
    if (!kcData || Object.keys(kcData).length === 0) {
      console.error(
        "[loadConfig] tidecloak config is empty. Web admin must provide config via /api/tidecloakConfig."
      );
      return {};
    }

    this._config = kcData;
    this._tc = new TideCloak({
      url: kcData["auth-server-url"],
      realm: kcData.realm,
      clientId: kcData.resource,
      vendorId: kcData.vendorId,
      homeOrkUrl: kcData.homeOrkUrl,
      pkceMethod: 'S256'
    });
    // default token-expiry handler
    this._tc.onTokenExpired = () => {
      this.updateIAMToken().catch(console.error);
    };

    return this._config;
  }

  /**
   * Get the initialized TideCloak client (throws if not loaded).
   */
  getTideCloakClient() {
    if (!this._tc) {
      throw new Error(
        "TideCloak client not initialized. Call loadConfig() before using this service."
      );
    }
    return this._tc;
  }

  /**
   * Called when the adapter is initialized.
   */
  onReady(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onReady = callback;
  }

  /**
   * Called after successful authentication.
   */
  onAuthSuccess(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onAuthSuccess = callback;
  }

  /**
   * Called if there was an error during authentication.
   */
  onAuthError(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onAuthError = callback;
  }

  /**
   * Called when the token is refreshed successfully.
   */
  onAuthRefreshSuccess(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onAuthRefreshSuccess = callback;
  }

  /**
   * Called if there was an error while trying to refresh the token.
   */
  onAuthRefreshError(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onAuthRefreshError = callback;
  }

  /**
   * Called if the user is logged out (session iframe or Cordova).
   */
  onAuthLogout(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onAuthLogout = callback;
  }

  /**
   * Override default token-expired handler.
   */
  setOnTokenExpired(callback) {
    const kc = this.getTideCloakClient();
    if (kc.didInitialize) return;
    kc.onTokenExpired = callback;
  }

  /**
   * Refresh token.
   */
  async updateIAMToken() {
    const kc = this.getTideCloakClient();
    const refreshed = await kc.updateToken();
    const expiresIn = Math.round(
      kc.tokenParsed.exp + kc.timeSkew - Date.now() / 1000
    );
    console.debug(
      refreshed
        ? `[updateIAMToken] Token refreshed: ${expiresIn}s`
        : `[updateIAMToken] Valid for: ${expiresIn}s`
    );
    if (typeof window !== 'undefined') {
      document.cookie = `kcToken=${kc.token}; path=/;`;
    }
  }

  /**
   * Force immediate token refresh (min validity = -1).
   */
  async updateToken() {
    const kc = this.getTideCloakClient();
    // clear old cookie
    document.cookie = 'kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const refreshed = await kc.updateToken(-1);
    const expiresIn = Math.round(
      kc.tokenParsed.exp + kc.timeSkew - Date.now() / 1000
    );
    console.debug(
      refreshed
        ? `[updateToken] Token refreshed immediately: ${expiresIn}s`
        : `[updateToken] No refresh needed, valid for: ${expiresIn}s`
    );
    if (typeof window !== 'undefined') {
      document.cookie = `kcToken=${kc.token}; path=/;`;
    }
  }

  /**
   * Init SSO check.
   */
  initIAM(onReady) {
    const kc = this.getTideCloakClient();
    if (typeof window === 'undefined') return;

    if (!kc.didInitialize) {
      kc.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html'
      })
      .then(authenticated => {
        if (authenticated && kc.token) {
          document.cookie = `kcToken=${kc.token}; path=/;`;
        }
        onReady?.(authenticated);
      })
      .catch(err => console.error('TideCloak init err:', err));
    } else {
      onReady?.(this.isLoggedIn());
    }
  }

  /**
   * Redirect to login flow.
   */
  doLogin() {
    this.getTideCloakClient().login({
      redirectUri: window.location.origin + '/auth/redirect'
    });
  }

  /**
   * Encrypt data.
   */
  async doEncrypt(data) {
    return this.getTideCloakClient().encrypt(data);
  }

  /**
   * Decrypt data.
   */
  async doDecrypt(data) {
    return this.getTideCloakClient().decrypt(data);
  }

  /**
   * Logout and clear cookie.
   *
   * TideCloak's built-in onAuthLogout event may not fire when logout is initiated via `kc.logout()` redirect.
   * We manually invoke the registered `onAuthLogout` callback here so that React state can update immediately,
   * before the full redirect takes place.
   */
  doLogout() {
    const kc = this.getTideCloakClient();
    // Clear the auth cookie
    document.cookie = 'kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // // Trigger the registered logout event callback synchronously
    // if (kc.onAuthLogout) {
    //   try { kc.onAuthLogout(); } catch (err) { console.error('Error in onAuthLogout callback', err); }
    // }
    // Perform the redirect to Keycloak logout endpoint
    kc.logout({
      redirectUri: window.location.origin + '/auth/redirect'
    });
  }

  /**
   * Check login status.
   */
  isLoggedIn() {
    const kc = this.getTideCloakClient();
    return !!kc.token;
  }

  /**
   * Get current token (refreshes if expiry <3s).
   */
  async getToken() {
    const kc = this.getTideCloakClient();
    const exp = this.getTokenExp();
    if (exp < 3) await this.updateIAMToken();
    return kc.token;
  }

  /**
   * Get the ID Token.
   */
  getIDToken() {
    const kc = this.getTideCloakClient();
    return kc.idToken;
  }

  /**
   * Get username from token.
   */
  getName() {
    const kc = this.getTideCloakClient();
    return kc.tokenParsed.preferred_username;
  }

  /**
   * Seconds until token expiry.
   */
  getTokenExp() {
    const kc = this.getTideCloakClient();
    return Math.round(kc.tokenParsed.exp + kc.timeSkew - Date.now() / 1000);
  }

  /**
   * Check realm role.
   */
  hasOneRole(role) {
    const kc = this.getTideCloakClient();
    return kc.hasRealmRole(role);
  }

  /**
   * Get custom claim from access token.
   */
  getValueFromToken(key) {
    const kc = this.getTideCloakClient();
    return kc.tokenParsed[key] ?? null;
  }

  /**
   * Get custom claim from ID token.
   */
  getValueFromToken(key) {
    const kc = this.getTideCloakClient();
    return kc.idTokenParsed[key] ?? null;
  }

  /**
   * Get DoB value from ID Token
   */
  getDoB = () => {
    const kc = this.getTideCloakClient();
    if (!kc) {  return null; }
    return kc.idTokenParsed?.dob;
};

/**
 * Get CC value from ID Token
 */
  getCC = () => {
    const kc = this.getTideCloakClient();
    if (!kc) {  return null; }
    return kc.idTokenParsed?.cc;
  };
}

// Export singleton instance
const iamService = new IAMService();
export default iamService;