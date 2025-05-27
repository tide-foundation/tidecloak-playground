"use client";

import { useEffect } from "react";

import { useAppContext } from "../../context/context";

import { useRouter } from "next/navigation";

import IAMService from "../../../lib/IAMService";
import { LoadingSquareFullPage } from "../../components/loadingSquare";

/**
 * Manages which path the demo should go down depending on token validity
 * @returns - this redirect path instead of return something it pushes to a different path
 */
export default function RedirectPage() {

  const {authenticated, contextLoading} = useAppContext();
  
  const router = useRouter();

  // Handles redirect when middle detects token expiry
  useEffect(() => {
    const doLogOut = async () => {
      IAMService.doLogout();
    }
    // Must be placed inside useEffect, because parameters don't exist during build for production
    // Parse the query string with URLSearchParams instead of useSearchParams()
    // useSearchParams() causes build issues in non-pure client components so this /auth/redirect wouldn't prerender.
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");

    if (auth === "failed"){
      sessionStorage.setItem("tokenExpired", "true");
      doLogOut();
    }
  }, [])

  // Handles redirect when loading context
  useEffect(() => {
    if (!contextLoading){
      if (authenticated){
        router.push("/user");
      }
      else {
        router.push("/");
      }                
    }       
  }, [contextLoading]);

  if (contextLoading){
    return <LoadingSquareFullPage/>
  }

  return;
}


