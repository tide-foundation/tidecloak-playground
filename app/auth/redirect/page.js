"use client"
import { useEffect } from "react";

import { useAppContext } from "../../context/context";

import { useRouter } from "next/navigation";

export default function RedirectPage() {

  const {authenticated, loading} = useAppContext();

  const router = useRouter();

  // This is the authentication callback page that securely fetch the JWT access token and redirects (stateless) session to the protected page
  useEffect(() => {
    if (!loading){
      
      if (authenticated){
        router.push("/user");
        
      }
      else {
        router.push("/");
      }                
    }       
  }, [loading]);

  return;
}


