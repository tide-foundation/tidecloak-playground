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

    const [loggedUser, setLoggedUser] = useState(null);
    const [RMClientID, setRMClientID] = useState("");
    const [isTideAdmin, setIsTideAdmin] = useState(false);

    useEffect(() => {
        // Get the stored user even on refresh of a page 
        const storedUser = localStorage.getItem("user");
        const storedRMClientID = localStorage.getItem("RMClientID");
        const storedIsTideAdmin = localStorage.getItem("isTideAdmin");
        if (storedUser){
            setLoggedUser(JSON.parse(storedUser));
        }
        if (storedRMClientID){
            setRMClientID(JSON.parse(storedRMClientID));
        }
        if (storedIsTideAdmin){
            setIsTideAdmin(JSON.parse(storedIsTideAdmin));
        }
    }, [])
    
    const logUser = async (user) => {
        setLoggedUser(user);
        const token = await IAMService.getToken();
        // Get Realm Management default client's ID
        const clientID = await appService.getRealmManagementId(baseURL, realm, token);
        setRMClientID(clientID);
        // Check if user already has the role
        setIsTideAdmin(await appService.checkUserAdminRole(baseURL, realm, user.id, clientID, token));
        // Store for incase the page gets refreshed
        localStorage.setItem("user", JSON.stringify(user));
        // Store for incase the page gets refreshed
        localStorage.setItem("RMClientID", JSON.stringify(RMClientID));
        // Store for incase the page gets refreshed
        localStorage.setItem("isTideAdmin", JSON.stringify(isTideAdmin));
    }
 
    return (
        <Context.Provider value={{realm, baseURL, logUser, loggedUser, RMClientID, isTideAdmin, setIsTideAdmin}}>
            {children}
        </Context.Provider>
    )
}

// Custom hook to call shared values in components
export const useAppContext = () => useContext(Context);