"use client";
import IAMService from "../../lib/IAMService";
import { useState, useEffect, useMemo } from "react";
import Button from "../components/button";
import {useAppContext} from '../context/context'
import appService from "../../lib/appService";
import AccordionBox from "../components/accordionBox";
import { LoadingSquareFullPage } from "../components/loadingSquare";
import '../styles/spinKit.css';
import "../styles/spinner.css";

// Animation only
function DecryptingText({ text, speed = 30 }) {
    const [displayed, setDisplayed] = useState('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed((prev) =>
            text
                .split('')
                .map((char, idx) => {
                if (idx < i) return text[idx];
                return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('')
            );
            i++;
            if (i > text.length) clearInterval(interval);
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return <span className="font-mono text-green-600">{displayed}</span>;
}

/**
 * Representation of each card and the decryption functionality for them
 * @param {boolean} isUser - true if it's the logged in user to decrypt or not
 * @param {Object} user - user object representation of demo user and dummy users
 * @param {string} username - to be displayed on each card
 * @param {string} dob - encrypted string to be decrypted and displayed on each card 
 * @param {string} cc - encrypted string to be decrypted and displayed on each card 
 * @returns {JSX.Element} - HTML for each card to be decrypted
 */
function DecryptedRow({ isUser, user, username, dob, cc }) {
    // State variable for handling Decrypt Button
    const [decrypted, setDecrypted] = useState(false);
    // State variable for handling Decrypt Button's spinner
    const [loadingButton, setLoadingButton] = useState(false);

    const [decryptionStatus, setDecryptionStatus] = useState("");
    const [animating, setAnimating] = useState(false);
    const [decryptedDob, setDecryptedDob] = useState("");
    const [decryptedCc, setDecryptedCc] = useState("");
    const [canReadDob, setCanReadDob] = useState();
    const [canReadCc, setCanReadCc] = useState();

    // If new user data arrives reset to potentially decrypt again
    useEffect(() => {
        setDecrypted(false);
        setCanReadDob(IAMService.hasOneRole("_tide_dob.selfdecrypt"));
        setCanReadCc(IAMService.hasOneRole("_tide_cc.selfdecrypt"));
    }, [user])

    // Calls on Decrypt button being selected to update the fields
    const handleDecrypt = async () => {
        
        let encryptedData = [];

        // Can't decrypt other users
        if (!isUser) {
            setDecryptionStatus("Access denied: You don't have decryption rights.");
            setTimeout(() => setDecryptionStatus(""), 3000);
            return;
        }
        else if (!canReadDob && !canReadCc){
            // Show error if no read permissions at all
            setDecryptionStatus("Access denied: You don't have decryption rights.");
            setTimeout(() => setDecryptionStatus(""), 3000);
            return;
        };

        // Prepare to decrypt all at once as an array 
        if (canReadDob){ 
            encryptedData.push({
                "encrypted": dob,
                "tags": ["dob"]
            });
        };

        if (canReadCc){
            encryptedData.push({
                "encrypted": cc,
                "tags": ["cc"]
            });
        };

        setAnimating(true);
        setTimeout(async () => {

            if (encryptedData.length > 0){
                setLoadingButton(true);
                const decryptedData = await IAMService.doDecrypt(encryptedData);
                // Set data to show at roughly same time, only decrypt the attributes user has read permissions to
                if (encryptedData.length === 2){                // Yes DoB Read permission, Yes CC Read Permission
                    setDecryptedDob(decryptedData[0]); 
                    setDecryptedCc(decryptedData[1]); 
                }
                else if (encryptedData[0].tags[0] === "dob"){   // Yes DoB Read permission, No CC Read Permission
                    setDecryptedDob(decryptedData[0]); 
                    setDecryptedCc(cc);
                }
                else {                                          // No DoB Read permission, Yes CC Read Permission
                    setDecryptedDob(dob); 
                    setDecryptedCc(decryptedData[0]); 
                }

                setDecrypted(true);
                setAnimating(false);
                setDecryptionStatus("Decrypted successfully!");
                setTimeout(() => setDecryptionStatus(""), 3000);
                setLoadingButton(false);
            }
            else {
                setDecryptedCc(cc);                             // No DoB Read permission, No CC Read Permission
                setDecryptedDob(dob); 
                setLoadingButton(false);
            }    
        }, 800); 
    };
    
    return (
    <div className="border border-gray-300 rounded p-4 bg-white shadow-sm space-y-2">
        <div className="text-sm font-mono break-all">
            <strong className="block text-gray-600 text-xs uppercase mb-1">Username</strong>
            {username}
        </div>

        <div className="text-sm font-mono break-all">
            <strong className="block text-gray-600 text-xs uppercase mb-1">Date of Birth</strong>
            <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {isUser && decrypted && dob && canReadDob? <DecryptingText text={decryptedDob} /> : dob}
            </span>
        </div>

        <div className="text-sm font-mono break-all">
            <strong className="block text-gray-600 text-xs uppercase mb-1">Credit Card</strong>
            <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {isUser && decrypted && cc && canReadCc? <DecryptingText text={decryptedCc} /> : cc}
            </span>
        </div>

        <div className="flex items-center gap-3">
            
            <Button onClick={handleDecrypt} disabled={decrypted ? decrypted : loadingButton}>
                {decrypted ? "✓ Decrypted" : "Decrypt"}
            </Button>                 
            {
                loadingButton
                ? <div className="spinner"/>
                : null
            }
            

            {decryptionStatus && (
            <span
                className={`text-sm ${decryptionStatus.startsWith("Access") ? "text-red-600" : "text-green-600"}`}
            >
                {decryptionStatus}
            </span>
            )}
        </div>

    </div>
    );
}

/**
 * Database Exposure Table to demonstration decryption 
 * @returns {JSX.Element} - HTML parent containing decryptable cards for each user
 */
export default function DatabaseExposure() {
    
    const {baseURL, realm, contextLoading} = useAppContext();

    const [users, setUsers] = useState([]);

    // Expandable extra databaseExposureTable information
    const [showExposureAccordion, setShowExposureAccordion] = useState(false);
    // Further expandable information
    const [showDeepDive, setShowDeepDive] = useState(false);

    // Show a loading screen while waiting for context with this variable
    const [overlayLoading, setOverlayLoading] = useState(false);

    // Show a loading screen when loading context (such as when refreshing browser) until finish
    // Fetch all user data when navigating
    useEffect(() => {
        if (!contextLoading){
            getAllUsers();
        }
        setOverlayLoading(true);
        
    }, [contextLoading])


    // Populate the Database Exposure cards, and set the current logged users
    const getAllUsers = async () => {
      const token = await IAMService.getToken(); 
      const users = await appService.getUsers(baseURL, realm, token);
      setUsers(users);

      setOverlayLoading(false);
    };

    return (
        !contextLoading && !overlayLoading
        ?
        <main className="flex-grow w-full pt-6 pb-16">
        <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
        <div className="w-full max-w-3xl"/>
            <div>
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
            </div>
            <div className="mt-6 space-y-6 pb-24 md:pb-36">
                {
                    // Let the data load first
                    users.length > 0 && !contextLoading
                    ?
                    users.map((user, i) => (
                        
                    <DecryptedRow key={i}
                    isUser={user.attributes?.vuid
                        ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? true : false
                        : false}
                    user={user}
                    username={user.username}
                    dob={user.attributes?.vuid
                        ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? user.attributes.dob[0] : user.attributes.dob
                        : user.attributes?.dob}
                    cc={user.attributes?.vuid
                        ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? user.attributes.cc[0] : user.attributes.cc
                        : user.attributes?.cc}
                    />
                    ))
                    : null
                }
            </div>    
        </div>
        <div className="h-10"/>
        </main>
        : <LoadingSquareFullPage/>
    );
}