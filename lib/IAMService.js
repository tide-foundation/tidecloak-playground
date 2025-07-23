import { TideCloak } from "@tidecloak/js";

/**
 * Singleton IAMService wrapping TideCloak client.
 * Call loadConfig() once in your AuthContext; loadConfig returns the adapter config so you can reuse it.
 * Register any event listeners *before* calling initIAM().
 */
class IAMService {
  constructor() {
    this._tc = null;
    this._config = null;
  }

  /**
   * Initialize the TideCloak SSO client.
   *
   * This function performs a Keycloak SSO check using TideCloak. It ensures that the
   * TideCloak configuration is loaded first (via `loadConfig()`), then initializes
   * the Keycloak client only once (guarded by `didInitialize`).
   *
   * @param {Function} onReady - Callback invoked when the SSO check completes.
   *                             Receives `true` if authenticated, otherwise `false`.
   */
  initIAM(onReady) {
    // Ensure we're in a browser environment (skip on server during SSR)
    if (typeof window === 'undefined') return;

    // Attempt to get the already-initialized TideCloak client
    let kc = this.getTideCloakClient();

    /**
     * Helper function to continue with initialization once client is ready.
     * @param {TideCloak} client - The initialized TideCloak instance.
     */
    const handleReady = (client) => {
      // Register token expiry handler to update the token.
      client.onTokenExpired = () => {
        this.updateIAMToken().catch(console.error);
      };
      
      // Only initialize if it hasn't been done yet
      if (!client.didInitialize) {
        client
          .init({
            onLoad: 'check-sso', // Perform silent SSO check
            silentCheckSsoRedirectUri:
              window.location.origin + '/silent-check-sso.html',
          })
          .then((authenticated) => {
            // If authenticated, save the token to a cookie
            if (authenticated && client.token) {
              document.cookie = `kcToken=${client.token}; path=/;`;
            }

            // Call the provided callback with the auth state
            onReady?.(authenticated);
          })
          .catch((err) => {
            console.error('TideCloak init error:', err);
            onReady?.(false);
          });
      } else {
        // Already initialized — check login status directly
        onReady?.(this.isLoggedIn());
      }
    };

    // If the client is not yet initialized, fetch config first
    if (kc === null) {
      this.loadConfig().then(() => {
        kc = this.getTideCloakClient();
        if (!kc) {
          console.error('TideCloak client failed to initialize.');
          onReady?.(false);
          return;
        }
        handleReady(kc);
      });
    } else {
      // Client already available — continue directly
      handleReady(kc);
    }
  }


  /**
   * Fetch config and instantiate TideCloak once.
   * @returns {object|null} The TideCloak adapter config
   */
  async loadConfig() {
    if (this._tc) return this._config;

    let kcData;
    // Fetch configuration in production
    try {
      const res = await fetch('/api/tidecloakConfig');
      kcData = await res.json();
    } catch (err) {
      console.error('[loadConfig] Failed to fetch tidecloak config:', err);
      return null;
    }

    if (!kcData || Object.keys(kcData).length === 0) {
      console.info(
        '[loadConfig] TideCloak config is empty. Ensure configuration is provided.'
      );
      return null;
    }

    this._config = kcData;
    this._tc = new TideCloak({
      url: kcData['auth-server-url'],
      realm: kcData.realm,
      clientId: kcData.resource,
      vendorId: kcData.vendorId,
      homeOrkUrl: kcData.homeOrkUrl,
      clientOriginAuth: kcData['client-origin-auth-' + window.location.origin],
      pkceMethod: 'S256',
    });

    return this._config;
  }


  /**
   * Get the initialized TideCloak client (throws if not loaded).
   */
  getTideCloakClient() {
    // If no current Tideclient is initialized, we try to init it
    if (!this._tc) {
      return null;
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
    if (!kc) { return null; }
    return kc.idTokenParsed?.dob;
  };

  /**
   * Get CC value from ID Token
   */
  getCC = () => {
    const kc = this.getTideCloakClient();
    if (!kc) { return null; }
    return kc.idTokenParsed?.cc;
  };

  getBaseUrl() {
    return this._config?.["auth-server-url"]?.replace(/\/$/, "") || "";
  }
}

// Export singleton instance
const iamService = new IAMService();
export default iamService;