"use client"

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { TideCloakProvider, useTideCloak } from "@tidecloak/nextjs";
import { IAMService } from "@tidecloak/js";

// Create custom context for extended auth functionality
const AuthContext = createContext();

/**
 * Custom auth provider that wraps TideCloakProvider and adds additional methods.
 * Provides all TideCloak functionality plus custom approval methods.
 */
export function AuthProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  // Load config from tidecloak.json via API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/tidecloakConfig');
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`);
        }
        const data = await response.json();
        setConfig(data);
        setConfigLoading(false);
      } catch (err) {
        console.error("Failed to load TideCloak config:", err);
        setConfigError(err);
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Show loading state while config is loading
  if (configLoading) {
    return <div>Loading configuration...</div>;
  }

  // If config is empty or not initialized (no realm), provide empty config to TideCloakProvider
  // TideCloakProvider will handle uninitialized state appropriately
  const tideCloakConfig = config && config.realm ? config : {};

  return (
    <TideCloakProvider config={tideCloakConfig}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </TideCloakProvider>
  );
}

/**
 * Internal provider that adds custom methods on top of TideCloak context
 */
function AuthContextProvider({ children }) {
  const tideCloakContext = useTideCloak();
  const [realm, setRealm] = useState("");

  // Extract realm from config when context is initialized
  useEffect(() => {
    if (!tideCloakContext.isInitializing) {
      try {
        const config = tideCloakContext.getConfig();
        if (config?.realm) {
          setRealm(config.realm);
        }
      } catch (error) {
        // Config not yet loaded - this is fine during initialization
        console.debug("[AuthContextProvider] Config not yet available:", error.message);
      }
    }
  }, [tideCloakContext.isInitializing, tideCloakContext]);

  /**
   * Check if user has a specific role (wrapper around hasRealmRole for backward compatibility).
   * @param {string} role - The role name to check
   * @returns {boolean} True if user has the role
   */
  const hasOneRole = useCallback((role) => {
    return tideCloakContext.hasRealmRole(role);
  }, [tideCloakContext]);

  /**
   * Request approval from Tide operator for change requests (front-channel mode only).
   * @param {Array<{id: string, request: Uint8Array}>} requests - Array of requests to approve
   * @returns {Promise<Array<{id: string, approved?: {request: Uint8Array}, denied?: boolean, pending?: boolean}>>}
   */
  const approveTideRequests = useCallback(async (requests) => {
    // Get the TideCloak client from IAMService
    const kc = IAMService.getTideCloakClient();
    const config = IAMService.getConfig();

    // Verify homeOrkUrl is configured
    if (!config?.homeOrkUrl) {
      throw new Error("TideCloak configuration missing homeOrkUrl. Please ensure tidecloak.json is properly initialized.");
    }

    // Verify doken is present (required for approval enclave)
    if (!kc.doken) {
      throw new Error("TideCloak doken not found. The approval enclave requires a doken (Tide token). Please ensure you're authenticated and have the necessary tokens.");
    }

    console.debug("[AuthProvider.approveTideRequests] TideCloak client state:", {
      hasDoken: !!kc.doken,
      hasToken: !!kc.token,
      homeOrkUrl: config.homeOrkUrl
    });

    const Status = {
      approved: "approved",
      denied: "denied",
      pending: "pending"
    };

    const response = await kc.requestTideOperatorApproval(requests);
    const results = response.map((res) => {
      if (res.status === Status.approved) {
        return {
          id: res.id,
          approved: {
            request: res.request
          }
        };
      } else if (res.status === Status.denied) {
        return {
          id: res.id,
          denied: true
        };
      } else if (res.status === Status.pending) {
        return {
          id: res.id,
          pending: true
        };
      } else {
        throw new Error('Unknown approval status');
      }
    });
    return results;
  }, []);

  /**
   * Get value from access token (wraps IAMService for backward compatibility).
   * @param {string} key - The claim name to retrieve
   * @returns {*} The claim value or null
   */
  const getValueFromToken = useCallback((key) => {
    return IAMService.getValueFromToken(key);
  }, []);

  /**
   * Get value from ID token (wraps IAMService for backward compatibility).
   * Note: IAMService uses capital ID in method name.
   * @param {string} key - The claim name to retrieve
   * @returns {*} The claim value or null
   */
  const getValueFromIdToken = useCallback((key) => {
    return IAMService.getValueFromIDToken(key);
  }, []);

  /**
   * Encrypt data using TideCloak (wraps IAMService for backward compatibility).
   * @param {Array<{data: string | Uint8Array, tags: string[]}>} data - Array of data to encrypt
   * @returns {Promise<Array<string | Uint8Array>>} Array of encrypted values
   */
  const doEncrypt = useCallback(async (data) => {
    return await IAMService.doEncrypt(data);
  }, []);

  /**
   * Decrypt data using TideCloak (wraps IAMService for backward compatibility).
   * @param {Array<{encrypted: string | Uint8Array, tags: string[]}>} data - Array of data to decrypt
   * @returns {Promise<Array<string | Uint8Array>>} Array of decrypted values
   */
  const doDecrypt = useCallback(async (data) => {
    return await IAMService.doDecrypt(data);
  }, []);

  // Combine TideCloak context with custom methods
  const contextValue = {
    ...tideCloakContext,
    realm,
    // Map isInitializing to contextLoading for backward compatibility
    contextLoading: tideCloakContext.isInitializing,
    // Backward compatibility aliases
    hasOneRole,
    updateToken: tideCloakContext.refreshToken,
    // Token value getters
    getValueFromToken,
    getValueFromIdToken,
    // Encryption/decryption
    doEncrypt,
    doDecrypt,
    // Custom methods
    approveTideRequests,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context with all TideCloak functionality plus custom methods.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
