"use client"

import React, { useState, useLayoutEffect, useEffect } from "react";

import AccordionBox from "./components/accordionBox";
import Button from "./components/button";

import IAMService from "../lib/IAMService";
// Required for the Approval and Commit Tide Encalve to work in the admin console.

import { useRouter, usePathname } from "next/navigation";

// Main App Component

export default function Login() {

  const pathname = usePathname();

 
  const [showLoginAccordion, setShowLoginAccordion] = useState(false);
  
  

  //const {realm, baseURL, logUser} = useAppContext();

  const [loading, setLoading] = useState(true);



  // Initiate Keycloak to handle token and Tide enclave
  useEffect(() => {
    IAMService.initIAM(() => {
        // Skip login screen if already logged in
        if (IAMService.isLoggedIn()){
            window.location.href = "/auth/redirect ";
    }
    setLoading(false);
    });
  }, [])

  const handleLogin = async () => {
    IAMService.doLogin();
  };

  
  return (
    !loading
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
                  <h2 className="text-3xl font-bold">Welcome to your demo app</h2>
                  <p>Traditional IAM is only as secure as the admins and systems managing it. TideCloak fundamentally removes this risk, by ensuring no-one holds the keys to the kingdom. Explore to learn how.</p>
                  <h3 className="text-xl font-semibold">BYOiD</h3>
                  <p className="text-base">Login or create an account to see the user experience demo.</p>
                  <Button onClick={handleLogin}>Login</Button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold mb-2">TideCloak Administration</h3>
                  <p className="mb-4">Check out the backend of TideCloak, your fully fledged IAM system.</p>
                  <div className="border border-dashed border-gray-500 p-4">
                    <ul className="list-disc list-inside">
                      <li>
                        Visit: <a href="http://xxxxxxxxxxxxxxxxxxxxx" className="text-blue-600">http://xxxxxxxxxxxxxxxxxxxxx</a>
                      </li>
                      <li>Use Credentials: admin / password</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            

            
          </div>

        </div>
      </main>
  : null
  );
}