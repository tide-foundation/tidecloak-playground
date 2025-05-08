"use client"

import { createContext, useContext, useState, useEffect } from "react";
// Instead of tidecloak.json as writing to that configuration file rerenders the whole application.
import settings from "/test-realm.json";
import IAMService from "../../lib/IAMService";
import appService from "../../lib/appService";

// Create once, share, and  avoid creating on each rerender. 
const Context = createContext();

const realm = settings.realm;
const baseURL = "http://localhost:8080";

/**
 * Updating baseURL and realm name for all pages and components is done here.
 * @param {JSX.Element} children - all other child components, so that they can access these values 
 * @returns {JSX.Element} - HTML, wrapped around everything in layout.js
 */
export const Provider = ({ children }) => {
    
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        IAMService.initIAM((auth) => {
            setAuthenticated(auth)
            setLoading(false);
          });
    }, [])

    const getToken = async () => {
        const token = await IAMService.getToken(); 
        setToken(token);
    }

    useEffect(() => {
        if (authenticated) {
            getToken();
        }
    }, [authenticated])

    return (
        <Context.Provider value={{realm, baseURL, authenticated, loading, token}}>
            {children}
        </Context.Provider>
    )
}

// Custom hook to call shared values in components
export const useAppContext = () => useContext(Context);