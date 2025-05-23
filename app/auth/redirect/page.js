"use client";

import { useEffect } from "react";

import { useAppContext } from "../../context/context";

import { useRouter } from "next/navigation";

import IAMService from "../../../lib/IAMService";
import { loadingSquareFullPage } from "../../components/loadingSquare";

export default function RedirectPage() {

  const {authenticated, contextLoading} = useAppContext();
  
  const router = useRouter();

  useEffect(() => {
    if (!contextLoading){
      // Must be placed inside useEffect, because parameters don't exist during build for production
      // Parse the query string with URLSearchParams instead of useSearchParams()
      // useSearchParams() causes build issues in non-pure client components so this /auth/redirect wouldn't prerender.
      const params = new URLSearchParams(window.location.search);
      const auth = params.get("auth");

      if (auth === "failed"){
        sessionStorage.setItem("tokenExpired", "true");
        IAMService.doLogout();
      }

      if (authenticated){
        router.push("/user");
      }
      else {
        router.push("/");
      }                
    }       
  }, [contextLoading]);

  if (contextLoading){
    return loadingSquareFullPage();
  }

  return;
}


