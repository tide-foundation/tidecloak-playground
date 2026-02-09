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

  // Load config from tidecloak.json
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/data/tidecloak.json');
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

  // If config is empty or not initialized (no realm), render children without TideCloakProvider
  // This allows the app to go through the initialization process
  if (!config || !config.realm) {
    return <MinimalAuthProvider>{children}</MinimalAuthProvider>;
  }

  return (
    <TideCloakProvider config={config}>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </TideCloakProvider>
  );
}

/**
 * Minimal auth provider for uninitialized state.
 * Provides basic context values so components don't crash during initialization.
 */
function MinimalAuthProvider({ children }) {
  const contextValue = {
    authenticated: false,
    isInitializing: true,
    contextLoading: true,
    realm: "",
    baseURL: "",
    getToken: async () => null,
    login: () => {},
    logout: () => {},
    hasRealmRole: () => false,
    hasOneRole: () => false,
    refreshToken: async () => null,
    updateToken: async () => null,
    getConfig: () => ({}),
    approveTideRequests: async () => {
      throw new Error("TideCloak not initialized. Please complete initialization first.");
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
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
      const config = tideCloakContext.getConfig();
      if (config?.realm) {
        setRealm(config.realm);
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

  // Combine TideCloak context with custom methods
  const contextValue = {
    ...tideCloakContext,
    realm,
    // Map isInitializing to contextLoading for backward compatibility
    contextLoading: tideCloakContext.isInitializing,
    // Backward compatibility aliases
    hasOneRole,
    updateToken: tideCloakContext.refreshToken,
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
