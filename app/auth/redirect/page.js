"use client";

import { useEffect } from "react";

import { useAppContext } from "../../context/context";

import { useRouter } from "next/navigation";

import IAMService from "../../../lib/IAMService";
import { LoadingSquareFullPage } from "../../components/loadingSquare";
import appService from "../../../lib/appService";

/**
 * Manages which path the demo should go down depending on token validity
 * @returns - this redirect path instead of return something it pushes to a different path
 */
export default function RedirectPage() {

  const { baseURL, realm, authenticated, contextLoading } = useAppContext();

  const router = useRouter();
  
  const startUserInfoEncryption = async () => {
  const token = await IAMService.getToken();
  const loggedUserId = IAMService.getValueFromToken("sub");
  const user = await appService.getUser(baseURL, realm, token, loggedUserId);
  const tokenDoB = IAMService.getDoB();
  const tokenCC = IAMService.getCC();

  let arrayToEncrypt = [];

  if (tokenDoB) {
    if (/[a-zA-Z]/.test(tokenDoB) === false) {
      arrayToEncrypt.push({
        "data": tokenDoB,
        "tags": ["dob"]
      })
    }
  }

  // Credit Card
  if (tokenCC) {
    if (/[a-zA-Z]/.test(tokenCC) === false) {
      arrayToEncrypt.push({
        "data": tokenCC,
        "tags": ["cc"]
      })
    }
  }

  if (arrayToEncrypt.length > 0) {
    // Encrypt the data for the first time
    const encryptedData = await IAMService.doEncrypt(arrayToEncrypt);
    // Save the updated user object to TideCloak
    const token = await IAMService.getToken();
    user.attributes.dob = encryptedData[0];
    user.attributes.cc = encryptedData[1];
    const response = await appService.updateUser(baseURL, realm, user, token);
    await IAMService.updateToken();
  }

}

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

    if (auth === "failed") {
      sessionStorage.setItem("tokenExpired", "true");
      doLogOut();
    }
  }, [])

  // Handles redirect when loading context
  useEffect(() => {
    if (!contextLoading) {
      if (authenticated) {
        startUserInfoEncryption().catch(err =>
          console.error("Error encrypting user info:", err)
        );
        router.push("/home");
      }
      else {
        router.push("/");
      }
    }
  }, [contextLoading]);

  return <LoadingSquareFullPage />
}
