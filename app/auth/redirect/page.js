"use client"
import React, { useEffect } from "react";
import IAMService from "/lib/IAMService";
import { useAppContext } from "../../context/context";

export default function RedirectPage() {
  const {setPage} = useAppContext();
  // This is the authentication callback page that securely fetch the JWT access token and redirects (stateless) session to the protected page
  useEffect(() => {
    IAMService.initIAM((authenticated) => {
      //window.location.href = "/protected";
      window.location.href = "/";                       //TODO: Temporary, redo when UI is done                     
    });
  }, []);

  return;
}


