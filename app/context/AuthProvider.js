"use client"

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { TideCloakProvider, useTideCloak } from "@tidecloak/nextjs";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

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
        setConfig({});
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  const tideCloakConfig = (config && config.realm) ? config : {};

  return (
    <TideCloakProvider config={tideCloakConfig}>
      <AuthContextProvider configLoading={configLoading}>
        {children}
      </AuthContextProvider>
    </TideCloakProvider>
  );
}

function AuthContextProvider({ children, configLoading }) {
  const tideCloakContext = useTideCloak();
  const [realm, setRealm] = useState("");
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);

  useEffect(() => {
    if (!tideCloakContext.isInitializing) {
      try {
        const config = tideCloakContext.getConfig();
        if (config?.realm) {
          setRealm(config.realm);
        }
      } catch (error) {
        console.debug("[AuthContextProvider] Config not yet available:", error.message);
      }
    }
  }, [tideCloakContext.isInitializing, tideCloakContext]);

  const hasOneRole = useCallback((role) => {
    return tideCloakContext.hasRealmRole(role);
  }, [tideCloakContext]);

  const contextValue = {
    ...tideCloakContext,
    realm,
    contextLoading: tideCloakContext.isInitializing || configLoading,
    backgroundProcessing,
    setBackgroundProcessing,
    hasOneRole,
    updateToken: tideCloakContext.refreshToken,
    forceUpdateToken: tideCloakContext.forceRefreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
