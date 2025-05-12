"use client"

import { createContext, useContext, useState, useEffect } from "react";
// Instead of tidecloak.json as writing to that configuration file rerenders the whole application.
import settings from "/test-realm.json";
import adapter from "/tidecloak.json";
import IAMService from "../../lib/IAMService";

// Create once, share, and  avoid creating on each rerender. 
const Context = createContext();

const realm = settings.realm;
let baseURL = "";

if (adapter && Object.keys(adapter).length > 0){
    baseURL = adapter["auth-server-url"].replace(/\/$/, "");
}

/**
 * Updating baseURL and realm name for all pages and components is done here.
 * @param {JSX.Element} children - all other child components, so that they can access these values 
 * @returns {JSX.Element} - HTML, wrapped around everything in layout.js
 */
export const Provider = ({ children }) => {

    const [authenticated, setAuthenticated] = useState(false);
    const [contextLoading, setContextLoading] = useState(true);

    useEffect(() => {
        IAMService.initIAM((auth) => {
            setAuthenticated(auth)
            setContextLoading(false);
          });
    }, [])

    return (
        <Context.Provider value={{realm, baseURL, authenticated, contextLoading}}>
            {children}
        </Context.Provider>
    )
}

// Custom hook to call shared values in components
export const useAppContext = () => useContext(Context);