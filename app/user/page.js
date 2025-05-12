"use client"

import IAMService from "../../lib/IAMService";
import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/context";
import appService from "../../lib/appService";
import { usePathname } from "next/navigation";
import AccordionBox from "../components/accordionBox";
import Button from "../components/button";
import DatabaseExposureTable from "../components/databaseExposureTable";

export default function User(){

    const pathname = usePathname();

    const {baseURL, realm, authenticated, contextLoading} = useAppContext();

    // const [loading, setLoading] = useState(true);

    const [loggedUser, setLoggedUser] = useState(null);
     
    const [expandedBlobs, setExpandedBlobs] = useState({});
    const [userFeedback, setUserFeedback] = useState("");
    const [showUserInfoAccordion, setShowUserInfoAccordion] = useState(false);
    

    const [showExposureAccordion, setShowExposureAccordion] = useState(false);
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [formData, setFormData] = useState({
        dob: "",
        cc: ""
    });

    const [users, setUsers] = useState([]);
    const [encryptedDob, setEncryptedDob] = useState("");
    const [encryptedCc, setEncryptedCc] = useState("");
        
    const handleUserFieldChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    useEffect(() => {
      if (!contextLoading){
        if (authenticated){
          
          getAllUsers();
        }
      }
     
    }, [authenticated])

    //Perform only when the context receives the logged user details
    useEffect(() => {
      if (loggedUser && !contextLoading){
        getUserData();
        
      }
    }, [loggedUser])

    // Populate the Database Exposure cards, and set the current logged user
    const getAllUsers = async () => {
      const token = await IAMService.getToken(); 
      const users = await appService.getUsers(baseURL, realm, token);
      setUsers(users);
      const loggedVuid =  await IAMService.getValueFromToken("vuid");
      const loggedInUser = users.find(user => {
        if (user.attributes.vuid[0] === loggedVuid){
            return user;
        }
      });
      setLoggedUser(loggedInUser);
    };

    //Decrypt the logged in user's data
    const getUserData = async () => { 
      // Let context data load first
      if (loggedUser){
        
          try {
              
            // If user has no read permission don't decrypt the data
            if (!IAMService.hasOneRole("_tide_cc.read")){
              setFormData(prev => ({...prev, cc: loggedUser.attributes.cc[0]}));
            }

            if (!IAMService.hasOneRole("_tide_dob.read")){
              setFormData(prev => ({...prev, dob: "0000-00-00"}));
            }

            // Fill the fields if logged user has the attributes
            if (loggedUser.attributes.dob && IAMService.hasOneRole("_tide_dob.read") && IAMService.hasOneRole("_tide_dob.selfdecrypt")){
              // Display this in accordion
              setEncryptedDob(loggedUser.attributes.dob[0]); // display when already encrypted in database
              // DOB format in Keycloak needs to be "YYYY-MM-DD" to display
              const decryptedDob = await IAMService.doDecrypt([
                {
                  "encrypted": loggedUser.attributes.dob[0],
                  "tags": ["dob"]
                }
              ])

              if (loggedUser.attributes.dob[0]){
                setFormData(prev => ({...prev, dob: decryptedDob[0]}));
              }
              else {
                setFormData(prev => ({...prev, dob: decryptedDob}));
              }
              
              
            }
          
            if (loggedUser.attributes.cc && IAMService.hasOneRole("_tide_cc.read") && IAMService.hasOneRole("_tide_cc.selfdecrypt")){
              // Display this in accordion
              setEncryptedCc(loggedUser.attributes.cc[0]); // display when already encrypted in database
              const decryptedCc = await IAMService.doDecrypt([
                  {
                    "encrypted": loggedUser.attributes.cc[0],
                    "tags": ["cc"]
                  }
              ])

              if (loggedUser.attributes.cc[0]){
                  setFormData(prev => ({...prev, cc: decryptedCc[0]}));
              }
              else {
                  setFormData(prev => ({...prev, cc: decryptedCc}));
              }

             
            }       
          } catch (error){
            // Set the raw data into the fields as they don't need to be decrypted (If they were saved not encrypted in Keycloak)
            setFormData(prev => ({...prev, dob: loggedUser.attributes.dob[0]}));
            setFormData(prev => ({...prev, cc: loggedUser.attributes.cc[0]}));

            // Data in Keycloak is not encrypted yet, so do this instead
            if (loggedUser.attributes.dob){
              const encryptedDob = await IAMService.doEncrypt([
                {
                  "data": loggedUser.attributes.dob[0],
                  "tags": ["dob"]
                }
              ])
              loggedUser.attributes.dob = encryptedDob[0];
              
              setEncryptedDob(encryptedDob[0]);
            }
            

            if (loggedUser.attributes.cc){
              const encryptedCc = await IAMService.doEncrypt([
                {
                  "data": loggedUser.attributes.cc[0],
                  "tags": ["cc"]
                }
              ])
              loggedUser.attributes.cc = encryptedCc[0];
              
              setEncryptedCc(encryptedCc[0]);
            }

            // Update the user with the encrypted data to prevent storage as raw
            const token = await  IAMService.getToken();
            const response = await appService.updateUser(baseURL, realm, loggedUser, token);

            console.log(error + " User Dob or CC was saved as raw data encrypting it and saving now.");
          }
      } 
    };
    
    const shortenString = (string) => {
        const start = string.slice(0, 30);
        const end = string.slice(200);
        return `${start} ....... ${end}`;
    } 

    const handleFormSubmit = async (e) => {
        try {
            e.preventDefault();
            if (formData.dob !== ""){
                const encryptedDob = await IAMService.doEncrypt([
                {
                    "data": formData.dob,
                    "tags": ["dob"]
                }
                ]);
                loggedUser.attributes.dob = encryptedDob[0];
                setEncryptedDob(encryptedDob[0]);
         
            }

            if (formData.cc !== ""){
                const encryptedCc = await IAMService.doEncrypt([
                {
                    "data": formData.cc,
                    "tags": ["cc"]
                }
                ]);
                loggedUser.attributes.cc = encryptedCc[0];
                setEncryptedCc(encryptedCc[0]);
            }

            const token = await IAMService.getToken();
            const response = await appService.updateUser(baseURL, realm, loggedUser, token);

            if (response.ok){
                setUserFeedback("Changes saved!");
                setTimeout(() => setUserFeedback(""), 3000); // clear after 3 seconds
                getAllUsers(); 
            }
        }
        catch (error) {
          console.log(error);
        }
        
    };

    return (
        !contextLoading
        ?
        
        <main className="flex-grow w-full pt-6 pb-16">
        <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
        <div className="w-full max-w-3xl">
        {pathname === "/user" && (
              <div key="user" className="space-y-4 relative">
                {/* Accordion toggle */}
                <button
                  onClick={() => setShowUserInfoAccordion(prev => !prev)}
                  className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                  aria-label="Toggle explanation"
                >
                  {showUserInfoAccordion ? "🤯" : "🤔"}
                </button>

                {/* Accordion content */}
                <AccordionBox title="Why is this special?" isOpen={showUserInfoAccordion}>
                  <p>
                    You’re seeing <strong>dynamic user field access</strong> in action. The form respects granular permissions
                    (read, write, none) in real time.
                  </p>
                  <p>
                    Access is governed by <strong>immutable policy requests</strong>, and changes are enforced only through
                    quorum approvals — including admin access itself.
                  </p>
                </AccordionBox>


                <h2 className="text-3xl font-bold mb-4">User Information</h2>

                <p className="text-sm text-gray-600 mb-6">This form is powered by real-time permission logic. Your ability to view or edit each field depends on your current access.</p>

                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  {
                    ["dob", "cc"].map((field) => {
                      const readPerms = IAMService.hasOneRole(field === "dob"? "_tide_dob.read" : "_tide_cc.read");
                      const writePerms = IAMService.hasOneRole(field === "dob"? "_tide_dob.write" : "_tide_cc.write");
                      const canRead = readPerms? true: false;
                      const canWrite = writePerms? true: false;
                      const label = field === "dob" ? "Date of Birth" : "Credit Card Number";
                      if (!canRead && !canWrite) return null; // hide if no access

                      return (
                        <div key={field}>
                          <label className="block font-medium text-sm mb-1">{label}</label>
                          {canRead && canWrite && (
                            <input
                              type={field === "dob" ? "date" : "text"}
                              value={formData[field]}
                              onChange={handleUserFieldChange(field)}
                              className="border rounded px-3 py-2 w-full max-w-md"
                            />
                          )}

                          {canRead && !canWrite && (
                            <input
                              type="text"
                              value={formData[field] || ""}
                              readOnly
                              className="border rounded px-3 py-2 w-full bg-gray-100 text-gray-700 max-w-md"
                            />
                          )}

                          {!canRead && canWrite && (
                            <input
                              type={field === "dob" ? "date" : "text"}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              value={formData[field]}
                              onChange={handleUserFieldChange(field)}
                              className="border rounded px-3 py-2 w-full max-w-md"
                            />
                          )}

                          {showUserInfoAccordion && (
                            <div className="text-xs text-gray-600 mt-2 space-y-2 bg-gray-50 border border-gray-200 rounded p-3">
                              <h5 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">
                                JWT Permissions & Encrypted Value
                              </h5>
                              <div className="flex gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canRead ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {canRead ? "✓" : "✕"} Read
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canWrite ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {canWrite ? "✓" : "✕"} Write
                                </span>
                              </div>

                             <div className="break-words whitespace-pre-wrap text-sm">
                              <span className="font-medium text-gray-700">Value in Database:</span>{" "}
                              <span
                                onClick={() =>
                                  setExpandedBlobs((prev) => ({ ...prev, [field]: !prev[field] }))
                                }
                                className="text-blue-600 underline cursor-pointer break-words"
                              >
                                {
                                  field === "dob" 
                                  ? expandedBlobs[field]
                                    ? encryptedDob
                                    : shortenString(encryptedDob)
                                  : expandedBlobs[field]
                                    ? encryptedCc
                                    : shortenString(encryptedCc)
                                }
                              </span>
                            </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  }
                  {
                  (IAMService.hasOneRole("_tide_dob.write") || IAMService.hasOneRole("_tide_cc.write")) && (
                    <div className="flex items-center gap-3">
                      <Button type="submit">Save Changes</Button>
                      {userFeedback && (
                        <span className="text-sm text-green-600 font-medium">{userFeedback}</span>
                      )}
                    </div>

                  )}
                </form>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold">Database Exposure Simulation</h3>

                    <button
                      onClick={() => setShowExposureAccordion(prev => !prev)}
                      className="text-2xl hover:scale-110 transition-transform"
                      aria-label="Toggle explanation"
                    >
                      {showExposureAccordion ? "🤯" : "🤔"}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">This simulates a user table leak through unprotected API or misconfigured server.</p>

                  <AccordionBox title="What does this simulate?" isOpen={showExposureAccordion}>
                    <p>
                      This simulation shows what happens when an encrypted user table is leaked.
                      Try decrypting your own row — other rows will remain locked unless you have access.
                    </p>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowDeepDive(prev => !prev)}
                        className="flex items-center gap-2 ml-auto text-xs font-medium text-blue-700 hover:text-blue-900 transition"
                        aria-label="Show technical explanation"
                      >
                        <span className="underline">Technical Deep Dive</span>
                        <span className="text-xl">🤓</span>
                      </button>
                    </div>

                    {showDeepDive && (
                      <div className="mt-3 border-t pt-4 space-y-3 text-xs text-gray-700">
                        <p>
                          🔐 Each record is encrypted at rest. Even if the table is exfiltrated, fields like DOB and CC remain opaque unless a valid JWT with <code className="bg-gray-100 px-1 py-0.5 rounded">read</code> rights is presented.
                          The decryption flow references permissions attached to the JWT — not role-based access.
                        </p>
                        <div className="w-full overflow-auto">
                          <img
                            src="/diagrams/db-decrypt-flow.svg"
                            alt="Decryption permission flow diagram"
                            className="w-full max-w-md border rounded shadow"
                          />
                        </div>
                        <p className="italic text-gray-500">
                          Excerpted from the <a href="https://github.com/tide-foundation/tidecloakspaces" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">TideCloakSpaces</a> repo.
                        </p>
                      </div>
                    )}
                  </AccordionBox>


                  <DatabaseExposureTable users={users} loggedUser={loggedUser} encryptedDob={encryptedDob} encryptedCc={encryptedCc}/>

                </div>

              </div>
            )}
        </div>
        </div>
        </main>
        
        : null 
    )
};