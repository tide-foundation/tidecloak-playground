"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthProvider";

import { useRouter } from "next/navigation";

import { LoadingSquareFullPage } from "../../components/loadingSquare";
import appService from "../../../lib/appService";

/**
 * Manages which path the demo should go down depending on token validity
 * @returns - this redirect path instead of return something it pushes to a different path
 */
export default function RedirectPage() {

  const auth = useAuth();
  const { baseURL, realm, authenticated, contextLoading } = auth;

  const router = useRouter();

  // Track encryption state
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionComplete, setEncryptionComplete] = useState(false);

  const startUserInfoEncryption = async () => {
  const token = await auth.getToken();
  const loggedVuid = auth.getValueFromToken("vuid");
  const user = await appService.getUserByVuid(baseURL, realm, token, loggedVuid);
  const tokenDoB = auth.getValueFromIdToken("dob");
  const tokenCC = auth.getValueFromIdToken("cc");

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
    const encryptedData = await auth.doEncrypt(arrayToEncrypt);
    // Save the updated user object to TideCloak
    const token = await auth.getToken();

    // Map encrypted data back to correct attributes based on tags
    for (let i = 0; i < arrayToEncrypt.length; i++) {
      const tag = arrayToEncrypt[i].tags[0];
      if (tag === "dob") {
        user[0].attributes.dob = encryptedData[i];
      } else if (tag === "cc") {
        user[0].attributes.cc = encryptedData[i];
      }
    }

    const response = await appService.updateUser(baseURL, realm, user[0], token);

    // Force immediate token refresh to get updated ID token with encrypted values
    console.log("Force refreshing token to get encrypted data in ID token...");

    // Wait a bit for backend to propagate changes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force refresh immediately (not just when expired)
    await auth.forceUpdateToken();
    console.log("First force refresh complete. Waiting for backend propagation...");

    // Wait for backend to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Second force refresh
    await auth.forceUpdateToken();
    console.log("Second force refresh complete. Waiting...");

    // Wait again
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Third force refresh to ensure we have the latest token
    await auth.forceUpdateToken();

    const updatedDob = auth.getValueFromIdToken("dob");
    const updatedCc = auth.getValueFromIdToken("cc");
    console.log("Token force refresh complete. New ID token dob:", updatedDob?.substring(0, 50) + "...");
    console.log("Token force refresh complete. New ID token cc:", updatedCc?.substring(0, 50) + "...");
  }

}

  // Handles redirect when middle detects token expiry
  useEffect(() => {
    const doLogOut = async () => {
      auth.logout();
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
        // Start encryption and wait for it to complete before navigating
        setIsEncrypting(true);
        startUserInfoEncryption()
          .then(() => {
            setIsEncrypting(false);
            setEncryptionComplete(true);
            router.push("/home");
          })
          .catch(err => {
            console.error("Error encrypting user info:", err);
            setIsEncrypting(false);
            setEncryptionComplete(true);
            // Navigate anyway even if encryption fails
            router.push("/home");
          });
      }
      else {
        router.push("/");
      }
    }
  }, [contextLoading]);

  // Show encryption status if encrypting
  if (isEncrypting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSquareFullPage />
        <div className="mt-8 text-center">
          <p className="text-xl font-semibold text-gray-700">Encrypting your data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we secure your information</p>
        </div>
      </div>
    );
  }

  return <LoadingSquareFullPage />
}
