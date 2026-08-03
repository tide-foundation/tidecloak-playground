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
  const { baseURL, realm, authenticated, contextLoading, setBackgroundProcessing } = auth;

  const router = useRouter();

  // Track encryption state
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionComplete, setEncryptionComplete] = useState(false);

  const startUserInfoEncryption = async () => {
  // On first login the vuid token claim and/or the user record can still be
  // propagating, which left `user` undefined the first time (it only resolved
  // on a later login). Resolve the user via the server (master token): under
  // the new IGA the default-role composite carries no realm-management roles
  // (MF2 guard), so the browser user cannot list users itself. Force-refresh
  // the token + retry until the user resolves so first-time login works.
  let loggedVuid = auth.getValueFromToken("vuid");
  let user;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (loggedVuid) {
      const response = await fetch(`/api/getUserByVuid?vuid=${encodeURIComponent(loggedVuid)}`);
      if (response.ok) {
        user = (await response.json()).user;
      }
      if (user) break;
    }
    await auth.forceUpdateToken();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    loggedVuid = auth.getValueFromToken("vuid");
  }

  if (!user) {
    console.warn("[auth/redirect] Could not resolve the logged-in user by vuid after retries; skipping first-login encryption.");
    return;
  }

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

    // Map encrypted data back to correct attributes based on tags
    for (let i = 0; i < arrayToEncrypt.length; i++) {
      const tag = arrayToEncrypt[i].tags[0];
      if (tag === "dob") {
        user.attributes.dob = encryptedData[i];
      } else if (tag === "cc") {
        user.attributes.cc = encryptedData[i];
      }
    }

    // Save server-side (master token) - the browser user holds no manage-users
    // under the new IGA, and the captured change request needs draining too.
    const response = await fetch(`/api/updateUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    if (!response.ok) {
      console.error("[auth/redirect] updateUser failed:", await response.text());
    }

    // Refresh so the ID token carries the freshly encrypted values. Bounded +
    // non-throwing: a refresh that hangs must not leave the user stuck on the
    // "Encrypting your data..." screen (the navigation below depends on it).
    console.log("Force refreshing token to get encrypted data in ID token...");
    await appService.refreshTokensAfterCommit(auth);

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
        // Keep the full-page "Encrypting your data..." overlay up until the
        // first-login encryption actually finishes, THEN navigate. Previously
        // this navigated after 800ms while encryption ran in the background, so
        // the user landed on /user before their data was encrypted and saved.
        setIsEncrypting(true);
        setBackgroundProcessing(true);

        // Hard ceiling on the whole first-login ceremony: if the enclave or a
        // token refresh stalls, still navigate instead of stranding the user
        // on the overlay with no way forward but a manual page refresh.
        Promise.race([
          startUserInfoEncryption(),
          new Promise((resolve) => setTimeout(() => {
            console.warn("[auth/redirect] First-login encryption timed out; continuing to the app.");
            resolve();
          }, 60000)),
        ])
          .then(() => {
            console.log("Encryption complete");
          })
          .catch(err => {
            console.error("Error encrypting user info:", err);
          })
          .finally(() => {
            setEncryptionComplete(true);
            setBackgroundProcessing(false);
            setIsEncrypting(false);
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
