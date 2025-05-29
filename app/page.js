'use client';

import { useState, useEffect } from "react";
import AccordionBox from "./components/accordionBox";
import Button from "./components/button";
import { useAppContext } from "./context/context";
import IAMService from "../lib/IAMService";
import { usePathname, useRouter } from "next/navigation";
import {
  FaExclamationCircle,
  FaChevronDown,
  FaCheckCircle
} from "react-icons/fa";
import LoadingPage from "./components/LoadingPage";
import appService from "../lib/appService";
import EmailInvitation from "./components/emailInvitation";
import { LoadingSquareFullPage } from "./components/loadingSquare";

/**
 * "/" path containing the Login page, logouts including token expiration is redirected here
 * @returns {JSX.Element} - HTML rendering the "/" path containing login functionality, message on token expiration and TideCloak backend address
 */
export default function Login() {
  // Shared context data to check if already authenticated skip this login screen
  const { authenticated, baseURL, setIsInitialized, overlayLoading } = useAppContext();

  // Current path "/"
  const pathname = usePathname();
  // Navigation manager
  const router = useRouter();
  // Expandable extra information
  const [showLoginAccordion, setShowLoginAccordion] = useState(false);
  const [showBackendDetails, setShowBackendDetails] = useState(false);
  // State for error message when token expires
  const [showError, setShowError] = useState(false);
  // TideCloak address
  const [adminAddress, setAdminAddress] = useState("Need to setup backend first.");
  // State to show initialiser when the tidecloak.json file has an empty object
  const [isInitializing, setIsInitializing] = useState(false);
  // State to show port status
  const [portIsPublic, setPortIsPublic] = useState(null);
  // State to show Tide account link status
  const [showLinkedTide, setShowLinkedTide] = useState(false);

  // State to show the Tide email invitation componenty
  const [isLinked, setIsLinked] = useState(true); 

  const [inviteLink, setInviteLink] = useState();
  // Loaded adapter config
  const [kcData, setKcData] = useState(null);

  const fetchConfig = async () => {
  try {
    const res = await fetch("/api/tidecloakConfig");
    const data = await res.json();

    // Show initialiser if tidecloak.json object is empty
    if (Object.keys(data).length === 0) {
      setIsInitializing(true);
      return;
    }
    
    // Get the TideCloak address from the tidecloak.json file if its object is filled by TideCloak
    if (data["auth-server-url"]) {
      setAdminAddress(data["auth-server-url"]);
    }
    setKcData(data);
    return data;

  } catch (error) {
    console.error("[Login] Failed to load config:", error);
    setKcData(null);
    setIsInitializing(true);
  }
};

  // Fetch kcData on context load
  useEffect(() => {
    // Fetch config if context already checks authentication
    fetchConfig();
  }, [authenticated]);

  // When fetchConfig provides kcData handle redirect based on it
  useEffect(() => {
    if (kcData){
      // Skip login screen if already authenticated
      if (authenticated) {
        router.push("/auth/redirect");
      }
      else if (!authenticated && Object.keys(kcData).length === 0) {
        // Show initialiser if tidecloak.json object is empty
        setIsInitializing(true);
      }
      
      // Get the TideCloak address from the tidecloak.json file if its object is filled by TideCloak
      if (kcData && Object.keys(kcData).length !== 0 && kcData["auth-server-url"]) {
        setAdminAddress(kcData["auth-server-url"]);
      }
    }
  }, [kcData])


  // Manage whether the token expired error should be shown using cached session data
  useEffect(() => {
    const checkPort = async () => {
      const data = await fetchConfig();
      if ( baseURL){
        checkTideCloakPort(data);
      }
    }
    const tokenExpired = sessionStorage.getItem("tokenExpired");
    if (tokenExpired) {
      setShowError(true);
    }

    checkTideLinkMsg();
    checkPort();
    checkTideLink();

  }, [baseURL])

  useEffect(() => {
    if(kcData && baseURL){
      checkTideCloakPort(kcData);
      // Get the TideCloak address from the tidecloak.json file if its object is filled by TideCloak
      if (kcData["auth-server-url"]) {
        setAdminAddress(kcData["auth-server-url"]);
      }
      
    }
  }, [kcData, baseURL])

  const checkTideLinkMsg = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedTide') === 'true') {
      setShowLinkedTide(true);
      await updateCustomDomainURL()
      params.delete('linkedTide');
      const newQs = params.toString();
      const newUrl = window.location.pathname + (newQs ? `?${newQs}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }

  // Every time Login page is visited, check if the demo account has been linked
  // for this demo's purpose
  const checkTideLink = async () => {
    // Generate invite link
    const response = await fetch(`/api/inviteUser`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.error || "Failed generate Tide invite link.");
    }

    const data = await response.json();

    // Redirect to invite link to link Tide account when user has no VUID
    if (data.inviteURL) {
      setInviteLink(data.inviteURL);
      setIsLinked(false);
    }
    else {
      // Login if user has already linked Tide account (VUID exists)
      setIsLinked(true);
    }
  }

  // Update the Custom Domain URL for the Tide Enclave to work
  const updateCustomDomainURL = async () => {
    const response = await fetch("/api/updateCustomDomainURL", { method: 'GET' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update domain URL');
    }
    return response;
  };

  // Can't connect to TideCloak if the ports are not public
  // It's public if there's an Ok response
  const checkTideCloakPort = async (data) => {    
    const url = `${baseURL}/realms/master/.well-known/openid-configuration`;

    try {
      // Only ping this endpoint if initialisation has already happened
      // Else the endpoint doesn't exist, because realm doesn't. 
      if (data && Object.keys(data).length !== 0){
        const response = await appService.checkPort(url);

        if (response.ok) {
          setPortIsPublic(true);
          console.log("TideCloak port is public.");
          
        }
        else {
          setPortIsPublic(false);
          throw new Error("TideCloak port is private, please change to public to allow connections.");
        }
      }
      else {
        throw new Error("Need to initialize realm first. Starting initializer.")
      }
    } catch (error){
      setPortIsPublic(false);
      console.log(error);
    }
  };


  // Redirect to Tide Enclave to sign in or link Tide account based on existence of user's VUID checked on backend to make inviteURL.
  const handleLogin = async () => {
    // If previously logged in remove this session variable.
    sessionStorage.removeItem("tokenExpired");
    // Turn off the message if TideCloak port wasn't public before
    setPortIsPublic(true);
    // Generate invite link
    const response = await fetch(`/api/inviteUser`, {
      method: "GET",
    })

    if (!response.ok) {
      checkTideCloakPort(kcData);
      const errorResponse = await response.json();
      throw new Error(errorResponse.error || "Failed generate Tide invite link.");
    }

    const data = await response.json();

    // Redirect to invite link to link Tide account when user has no VUID
    if (data.inviteURL) {
      router.push(data.inviteURL);
    }
    else {
      // Login if user has already linked Tide account (VUID exists)
      IAMService.doLogin();
    }
  };

  // Show the initialiser
  if (isInitializing) {
    return <LoadingPage isInitializing={isInitializing} setIsInitializing={setIsInitializing} setKcData={setKcData} setIsInitialized={setIsInitialized}/>;
  }

  // Show Email Invitation Page if demo user not linked to a Tide account after Initialization
  if (!isLinked && !overlayLoading) {
    return <EmailInvitation inviteLink={inviteLink}/>;
  }

  return (
    !overlayLoading && isLinked
      ?
      <main className="flex-grow w-full pt-6 pb-16">

        <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
          <div className="w-full max-w-3xl">
            {pathname === "/" && (
              <div key="user" className="space-y-4 relative pb-32 md:pb-40">

                {/* Accordion Toggle for Landing Page */}
                <button
                  onClick={() => setShowLoginAccordion(prev => !prev)}
                  className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                  aria-label="Toggle explainer"
                >
                  {showLoginAccordion ? "🤯" : "🤔"}
                </button>

                {/* Accordion Content */}
                <AccordionBox title="Why is this login special?" isOpen={showLoginAccordion}>
                  <p>
                    This login page showcases <strong>TideCloak's decentralized IAM model</strong>.
                  </p>
                  <p>
                    Admin powers, even login elevation, are <strong>quorum-controlled</strong> — not granted unilaterally.
                  </p>
                  <p>
                    The system itself has no backdoor. That’s the point.
                  </p>
                </AccordionBox>

                <div className="bg-blue-50 rounded shadow p-6 space-y-4">
                  <img
            src="/playground-logo_nav.png"
            alt="Playground Logo"
            className="h-10 w-auto"
          />
                  <h2 className="text-3xl font-bold">Welcome to Play - a demo of provable security in action</h2>
                  <p>Your admin is breached. IAM vendor compromised. Cloud host exposed.<br />And still - no data leaks, no identities stolen, no access abused.<br />That’s TideCloak. Build trust. Ship fast. Sleep easy.</p>
                  <h3 className="text-xl font-semibold">Secure "BYOiD" Login</h3>
                  <p className="text-base">Log in like normal - but your password is never stored, shared, or exposed.</p>
                  <Button onClick={handleLogin} className="hover:bg-red-700">Login</Button>
                  <p className="text-sm italic text-gray-600 mt-3">Identity for your eyes only.</p>
                  {
                    showError
                      ?
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <FaExclamationCircle className="mr-1" />
                        <span>Your session has expired. Please login again.</span>
                      </div>
                      : null
                  }
                  {
                    portIsPublic !== null && !portIsPublic
                      ?
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <FaExclamationCircle className="mr-1" />
                        <span>TideCloak port is private, make it public to allow connections.</span>
                      </div>
                    : null
                  }             
                  {/* just linked Tide */}
                  {showLinkedTide && (
                    <div className="mt-2 flex items-center text-green-600 text-sm">
                      <FaCheckCircle className="mr-1" />
                      <span>You have successfully linked your Tide account! Please login.</span>
                    </div>
                  )}
                </div>

                <div className="pl-6 mt-2">
                  <button
                    onClick={() => setShowBackendDetails(prev => !prev)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-500 text-sm transition"
                  >
                    <span>View TideCloak Backend</span>
                    <FaChevronDown
                      className={`transform transition-transform duration-300 ${showBackendDetails ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div className="mt-2">
                    <AccordionBox title="TideCloak Administration" isOpen={showBackendDetails}>
                      <p className="mb-4">Check out the backend of TideCloak, your fully fledged IAM system.</p>
                      <div className="border border-dashed border-gray-500 p-4">
                        <ul className="list-disc list-inside">
                          <li>
                        Visit: <a href={adminAddress} className="text-blue-600">{adminAddress}</a>
                      </li>
                      <li>Use Credentials: admin / password</li>
                    </ul>
                  </div>
                  </AccordionBox>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
        <div className="h-10"></div>
      </main>
      : <LoadingSquareFullPage/>
  );
}
