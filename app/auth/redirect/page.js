"use client"
import { useEffect } from "react";

import { useAppContext } from "../../context/context";

import { useRouter, useSearchParams } from "next/navigation";

import IAMService from "../../../lib/IAMService";

export default function RedirectPage() {

  const {authenticated, contextLoading} = useAppContext();
  const params = useSearchParams();
  const auth = params.get("auth");
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading){

      if (auth === "failed"){
        sessionStorage.setItem("tokenExpired", true);
        IAMService.doLogout(); // The redirect would be calling upon itself here to check if authenticated
      }

      if (authenticated){
        router.push("/user");
        
      }
      else {
        router.push("/");
      }                
    }       
  }, [contextLoading]);

  return;
}


