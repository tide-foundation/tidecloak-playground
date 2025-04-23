"use client"

import IAMService from "../../lib/IAMService";
import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/context";
import appService from "../../lib/appService";

export default function User(){

    const {baseURL, realm, logUser} = useAppContext();

    useEffect(() => {
        IAMService.initIAM(() => {
            if (IAMService.isLoggedIn()){
                setLoggedInUser()
            }
        });
    }, [])

    // Provide the context the logged in user object to be shared across components
    const setLoggedInUser = async () => { 
        const token = await IAMService.getToken();
        const loggedVuid =  await IAMService.getValueFromToken("vuid");
        const users = await appService.getUsers(baseURL, realm, token);
        const user = users.find(user => {
        if (user.attributes.vuid[0] === loggedVuid){
            return user;
        }
    });
        logUser(user); // Record to context 
    }

    return (
        <div><p>hi</p></div>
    )
};