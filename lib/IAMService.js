import TideCloak from "tidecloak-js";

/**
 * Singleton IAMService wrapping TideCloak client.
 * Call loadConfig() once in your AuthContext; loadConfig returns the adapter config so you can reuse it.
 */
class IAMService {
  constructor() {
    this._tc = null;
    this._config = null;
  }

  /**
   * Fetch config and instantiate TideCloak once.
   * @returns {object|null} The TideCloak adapter config (same data as from /api/tidecloakConfig)
   */
  async loadConfig() {
    if (this._tc) {
      return this._config;
    }

    const res = await fetch("/api/tidecloakConfig");
    const kcData = await res.json();

    if (!kcData || Object.keys(kcData).length === 0) {
      console.error(
        "[loadConfig] tidecloak config is empty. Web admin must provide config via /api/tidecloakConfig."
      );
      return null;
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
    this._tc.onTokenExpired = () => {
      try { this.updateIAMToken(); } catch (e) { console.error(e); }
    };

    return this._config;
  }

  /**
   * Return the initialized TideCloak client.
   * Throws if not loaded.
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
   * Refresh token if needed (min validity = 300s).
   */
  async updateIAMToken() {
    const kc = this.getTideCloakClient();
    const refreshed = await kc.updateToken(300);
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
      onReady?.(true);
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
   */
  doLogout() {
    document.cookie = 'kcToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    this.getTideCloakClient().logout({
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
   * Get username from token.
   */
  getName() {
    return this.getTideCloakClient().tokenParsed.preferred_username;
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
    return this.getTideCloakClient().hasRealmRole(role);
  }

  /**
   * Get custom claim from token.
   */
  getValueFromToken(key) {
    return this.getTideCloakClient().tokenParsed[key] ?? null;
  }
}

// Export singleton
const iamService = new IAMService();
export default iamService;
