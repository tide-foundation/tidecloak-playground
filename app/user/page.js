"use client"

import IAMService from "../../lib/IAMService";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/context";
import appService from "../../lib/appService";
import { usePathname } from "next/navigation";
import AccordionBox from "../components/accordionBox";
import Button from "../components/button";
import { LoadingSquareFullPage } from "../components/loadingSquare";
import "../styles/spinKit.css";
import "../styles/spinner.css";

/**
 * Page containing read and write functionality of user data (on top) and the decryption component (below).
 * @returns {JSX.Element} - HTML structure of the /user landing page after login, parent of databaseExposureTable
 */
export default function User(){

    // Current path displayed
    const pathname = usePathname();

    // Shared data across the application
    const {baseURL, realm, authenticated, contextLoading} = useAppContext();

    // Logged in user object
    const [loggedUser, setLoggedUser] = useState(null);
    
    // Data from ID Token
    const [tokenCC, setTokenCC] = useState();
    const [tokenDoB, setTokenDoB] = useState();
    
    // Encrypted user data in the database, modified to expand for full view or shortened.
    const [expandedBlobs, setExpandedBlobs] = useState({});
    // Confirmation message displayed to user after button click
    const [userFeedback, setUserFeedback] = useState("");
    // Expandable extra user information
    const [showUserInfoAccordion, setShowUserInfoAccordion] = useState(false);
    
    // Show the page only after all data loaded
    const [dataLoading, setDataLoading] = useState(true);
    // Show a loading screen while waiting for context with this variable
    const [overlayLoading, setOverlayLoading] = useState(false);
    // State variable for managing button and its spinner
    const [loadingButton, setLoadingButton] = useState(false);

    // Data values for user information component
    const [formData, setFormData] = useState({
        dob: "",
        cc: ""
    });

    // Encrypted Date of Birth from database to decrypted in databaseExposureTable
    const [encryptedDob, setEncryptedDob] = useState("");
    // Encrypted Credit Card from database to decrypted in databaseExposureTable
    const [encryptedCc, setEncryptedCc] = useState("");


    // Only show overlay when context is loading
    useEffect(() => {
      if (contextLoading){
        setOverlayLoading(true);
      }
    }, [])

    // Runs first, once context verifies user is authenticated populate all users' demo data
    useEffect(() => {
      if (!contextLoading){
        if (authenticated){
          getAllUsers();
        }
      }
    }, [authenticated])

    // Runs second, perform only when the context receives the logged user details to decrypt
    useEffect(() => {
      if (loggedUser && !contextLoading){
        getUserData();
      }
    }, [loggedUser])

    // Update the value of the two user input fields when user interacts
    const handleUserFieldChange = (field) => (e) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

    // Populate the Database Exposure cards, and set the current logged users
    const getAllUsers = async () => {
      setDataLoading(true);

      // This is for the Accordion - it shows data directly from the database as is, not from id token.
      const token = await IAMService.getToken(); 
      const users = await appService.getUsers(baseURL, realm, token);
      const loggedVuid =  IAMService.getValueFromToken("vuid");
      const loggedInUser = users.find(user => {
        if (user.attributes?.vuid[0] === loggedVuid){
            return user;
        }
      });
      setLoggedUser(loggedInUser);

      // Use the encrypted DoB and CC from the identity token for this Users Page
      setTokenDoB(IAMService.getDoB());
      setTokenCC(IAMService.getCC());
    };

    // Decrypt the logged in user's data
    const getUserData = async () => { 
      // Let context data load first
      if (loggedUser){
          try {
            let arrayToDecrypt = [];

            // Date of Birth
            if (tokenDoB && IAMService.hasOneRole("_tide_dob.selfdecrypt")){
              arrayToDecrypt.push({
                "encrypted": tokenDoB,
                "tags": ["dob"]
              })
            }

            // Credit Card
            if (tokenCC && IAMService.hasOneRole("_tide_cc.selfdecrypt")){
               arrayToDecrypt.push({
                "encrypted": tokenCC,
                "tags": ["cc"]
              })
            }

            if (arrayToDecrypt.length === 0){
              throw new Error("No Read Permissions. Displaying only encrypted data.");
            }

            if (arrayToDecrypt.length > 0){
              const decryptedData = await IAMService.doDecrypt(arrayToDecrypt);
              
              if (arrayToDecrypt.length === 2){
                // User Information
                setFormData(prev => ({...prev, dob: decryptedData[0]}));
                setFormData(prev => ({...prev, cc: decryptedData[1]}));
                // For Accordion - use the data directly from the database
                setEncryptedDob(loggedUser.attributes.dob[0]); 
                setEncryptedCc(loggedUser.attributes.cc[0]); 
              }
              else if (arrayToDecrypt[0].tags[0] === "dob"){
                // User Information
                setFormData(prev => ({...prev, dob: decryptedData[0]}));
                setFormData(prev => ({...prev, cc: tokenCC}));
                // For the Accordion - use the data directly from the database
                setEncryptedDob(loggedUser.attributes.dob[0]); 
                setEncryptedCc(loggedUser.attributes.cc[0]); 
              }
              else { 
                // User Information
                setFormData(prev => ({...prev, dob: tokenDoB}));
                setFormData(prev => ({...prev, cc: decryptedData[0]}));
                // For Accordion - use the data directly from the database
                setEncryptedDob(loggedUser.attributes.dob[0]); 
                setEncryptedCc(loggedUser.attributes.cc[0]); 
              }
            }
            // Close the overlay
            setOverlayLoading(false);
            setDataLoading(false);

          } catch (error){
            // This catch is currently implemented for this demo's purposes
            // Mainly to handle the raw data from the initialisation. Data needs to be raw initially to be uniquely encrypted and decrypted.
            
            let arrayToEncrypt = []; 
            setFormData(prev => ({...prev, dob: tokenDoB}));
            
            // Both fields shouldn't have letters unless it's encrypted, check that they're raw number strings
            // Or check that they're base64
            // Date of Birth
            if (tokenDoB){
              if (/[a-zA-Z]/.test(tokenDoB)){
                setFormData(prev => ({...prev, dob: tokenDoB}))
                setEncryptedDob(tokenDoB); 
              }
              else {
                arrayToEncrypt.push({
                  "data": tokenDoB,
                  "tags": ["dob"]
                })
              }
            }
          
            // Credit Card
            if (tokenCC){
              if (/[a-zA-Z]/.test(tokenCC)){
                setFormData(prev => ({...prev, cc: tokenCC}));
                setEncryptedCc(tokenCC); 
              }
              else {
                arrayToEncrypt.push({
                  "data": tokenCC,
                  "tags": ["cc"]
                })
              }
            }
            
            if (arrayToEncrypt.length > 0){
              // Encrypt the data for the first time
              const encryptedData = await IAMService.doEncrypt(arrayToEncrypt);

              if (IAMService.hasOneRole("_tide_cc.selfdecrypt")){
                setFormData(prev => ({...prev, cc: tokenCC}));
              }
              else {
                setFormData(prev => ({...prev, cc: encryptedData[1]}));
              }
             
              // For the Accordion - use the data directly from the database
              setEncryptedDob(encryptedData[0]); 
              setEncryptedCc(encryptedData[1]); 

              // Encrypted data to be saved on server for demo user to be decrypted with the same key.
              loggedUser.attributes.dob = encryptedData[0];
              loggedUser.attributes.cc = encryptedData[1];
            }

            // Save the updated user object to TideCloak
            const token = await  IAMService.getToken();
            const response = await appService.updateUser(baseURL, realm, loggedUser, token);

            console.log(error);

            // Show the data at once
            setOverlayLoading(false);
            setDataLoading(false);
           
          }
      } 
    };
    
    // Converts saved encrypted blobs to shortened versions to display in accordions
    const shortenString = (string) => {
        const start = string.slice(0, 30);
        const end = string.slice(200);
        return `${start} ....... ${end}`;
    } 

    // On Save changes button clicked, encrypt the updated data and store in TideCloak
    const handleFormSubmit = async (e) => {
        setLoadingButton(true);

        try {
            // Don't perform regular browser operations for this form
            e.preventDefault();

            let arrayToEncrypt = [];

            if (formData.dob !== "" && IAMService.hasOneRole("_tide_dob.selfencrypt")){ 
              if (loggedUser.attributes.dob){
                if (/[a-zA-Z]/.test(formData.dob)){
                  console.log("DoB can't have letters. Don't encrypt as it may already be encrypted.");
                }
                else {
                  arrayToEncrypt.push({
                    "data": formData.dob,
                    "tags": ["dob"]
                  })
                }
              }
            }

            if (formData.cc !== "" && IAMService.hasOneRole("_tide_cc.selfencrypt")){
              if (loggedUser.attributes.cc){
                if (/[a-zA-Z]/.test(formData.cc)){
                  console.log("CC can't have letters. Don't encrypt as it may already be encrypted.");
                }
                else {
                  arrayToEncrypt.push({
                    "data": formData.cc,
                    "tags": ["cc"]
                  })
                }
              }
            }

            if (arrayToEncrypt.length > 0){
              const encryptedData = await IAMService.doEncrypt(arrayToEncrypt);
              if (arrayToEncrypt.length === 2){
                setEncryptedDob(encryptedData[0]);
                setEncryptedCc(encryptedData[1]); 
                loggedUser.attributes.dob = encryptedData[0];
                loggedUser.attributes.cc = encryptedData[1];
              }
              else if (arrayToEncrypt[0].tags[0] === "dob"){
                setEncryptedDob(encryptedData[0]);
                setEncryptedCc(loggedUser.attributes.cc[0]);
                loggedUser.attributes.dob = encryptedData[0];
              }
              else {
                setEncryptedDob(loggedUser.attributes.dob[0]);
                setEncryptedCc(encryptedData[0]); 
                loggedUser.attributes.cc = encryptedData[0];
              }

            }

            // Store the data
            const token = await IAMService.getToken();
            const response = await appService.updateUser(baseURL, realm, loggedUser, token);
            // Updating the access token should also update the ID token
            await IAMService.updateToken();

            // Show the confirmation message
            if (response.ok){
                setUserFeedback("Changes saved!");
                setTimeout(() => setUserFeedback(""), 3000); // Clear after 3 seconds
                getAllUsers(); 
            }
            setDataLoading(false);
            setLoadingButton(false);
        }
        catch (error) {
          setLoadingButton(false);
          console.log(error);
        } 
    };

    return (
  (contextLoading || overlayLoading || dataLoading)
    ? (
      <LoadingSquareFullPage />
    )
    : (
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
                {(
                  !IAMService.hasOneRole("_tide_dob.selfdecrypt") &&
                  !IAMService.hasOneRole("_tide_dob.selfencrypt") &&
                  !IAMService.hasOneRole("_tide_cc.selfdecrypt") &&
                  !IAMService.hasOneRole("_tide_cc.selfencrypt")
                ) ? (
                  <p className="text-sm text-gray-600 mb-6">
                    You don't have permission to do anything so we won't even show you the form!
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-6">
                    This form is powered by real-time permission logic. Your ability to view or edit each field depends on your current access.
                  </p>
                )}

                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  {["dob", "cc"].map((field, i) => {
                    const readPerms = IAMService.hasOneRole(field === "dob" ? "_tide_dob.selfdecrypt" : "_tide_cc.selfdecrypt");
                    const writePerms = IAMService.hasOneRole(field === "dob" ? "_tide_dob.selfencrypt" : "_tide_cc.selfencrypt");
                    const canRead = !!readPerms;
                    const canWrite = !!writePerms;
                    const label = field === "dob" ? "Date of Birth" : "Credit Card Number";

                    // If user has neither read nor write permissions, only show the “encrypted” accordion block
                    if (!canRead && !canWrite) {
                      return (
                        <div key={i}>
                          {showUserInfoAccordion && (
                            <div className="text-xs text-gray-600 mt-2 space-y-2 bg-gray-50 border border-gray-200 rounded p-3">
                              <h5 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">
                                JWT Permissions &amp; Encrypted Value
                              </h5>
                              <div className="flex gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                    canRead ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {canRead ? "✓" : "✕"} Read
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                    canWrite ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {canWrite ? "✓" : "✕"} Write
                                </span>
                              </div>
                              <div className="break-words whitespace-pre-wrap text-sm">
                                <span className="font-medium text-gray-700">Value in Database:</span>{" "}
                                <span
                                  onClick={() =>
                                    setExpandedBlobs(prev => ({ ...prev, [field]: !prev[field] }))
                                  }
                                  className="text-blue-600 underline cursor-pointer break-words"
                                >
                                  {field === "dob"
                                    ? (expandedBlobs[field] ? encryptedDob : shortenString(encryptedDob))
                                    : (expandedBlobs[field] ? encryptedCc : shortenString(encryptedCc))}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Otherwise, render a normal input (read/write, read-only, or write-only)
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
                              JWT Permissions &amp; Encrypted Value
                            </h5>
                            <div className="flex gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  canRead ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {canRead ? "✓" : "✕"} Read
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  canWrite ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {canWrite ? "✓" : "✕"} Write
                              </span>
                            </div>
                            <div className="break-words whitespace-pre-wrap text-sm">
                              <span className="font-medium text-gray-700">Value in Database:</span>{" "}
                              <span
                                onClick={() =>
                                  setExpandedBlobs(prev => ({ ...prev, [field]: !prev[field] }))
                                }
                                className="text-blue-600 underline cursor-pointer break-words"
                              >
                                {field === "dob"
                                  ? (expandedBlobs[field] ? encryptedDob : shortenString(encryptedDob))
                                  : (expandedBlobs[field] ? encryptedCc : shortenString(encryptedCc))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(IAMService.hasOneRole("_tide_dob.selfencrypt") || IAMService.hasOneRole("_tide_cc.selfencrypt")) && (
                    <div className="flex items-center gap-3">
                      <Button className="hover:bg-red-700" type="submit" disabled={loadingButton}>
                        Save Changes
                      </Button>
                      {loadingButton && <div className="spinner" />}
                      {userFeedback && (
                        <span className="text-sm text-green-600 font-medium">
                          {userFeedback}
                        </span>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
        <div className="h-10" />
      </main>
    )
  )
}
