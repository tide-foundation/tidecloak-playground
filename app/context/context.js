"use client"

import { createContext, useContext, useState, useEffect } from "react";
// Instead of tidecloak.json as writing to that configuration file rerenders the whole application.
import settings from "/test-realm.json";
import IAMService from "../../lib/IAMService";

// Create once, share, and  avoid creating on each rerender. 
const Context = createContext();

/**
 * Updating baseURL and realm name for all pages and components is done here.
 * @param {JSX.Element} children - all other child components, so that they can access these values 
 * @returns {JSX.Element} - HTML, wrapped around everything in layout.js
 */
export const Provider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [contextLoading, setContextLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [baseURL, setBaseURL] = useState("");
    const realm = settings.realm;
    const initContext = async () => {
        try {
            const adapterRes = await fetch("/api/tidecloakConfig");
            const adapter = await adapterRes.json();

            if (adapter && Object.keys(adapter).length > 0 && adapter["auth-server-url"]) {
                setBaseURL(adapter["auth-server-url"].replace(/\/$/, ""));
            } 

            console.log("i am here")
            // Initialize IAM
            IAMService.initIAM((auth) => {
                setAuthenticated(auth);
                setContextLoading(false);
            });
        } catch (err) {
            console.error("Failed to initialize app context:", err);
            setContextLoading(false);
            console.log("setting contextloading to false")

        }
    };

    useEffect(() => {
        initContext();
    }, [isInitialized]);
    return (
        <Context.Provider value={{realm, baseURL, authenticated, contextLoading, setIsInitialized}}>
            {children}
        </Context.Provider>
    )
}

// Custom hook to call shared values in components
export const useAppContext = () => useContext(Context);