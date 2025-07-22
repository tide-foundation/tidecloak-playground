"use client";
import IAMService from "../../lib/IAMService";
import { useState, useEffect } from "react";
import Button from "../components/button";
import { useAppContext } from '../context/context'
import appService from "../../lib/appService";
import AccordionBox from "../components/accordionBox";
import { LoadingSquareFullPage } from "../components/loadingSquare";
import '../styles/spinKit.css';
import "../styles/spinner.css";

// Animation only, so it looks cool, because the real magic is invisible.
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
function DecryptedRow({ user, baseUrl, realm }) {
    // --- state hooks
    // State variable for handling Decrypt Button
    const [decrypted, setDecrypted] = useState(false);
    // State variable for handling Decrypt Button's spinner
    const [loadingButton, setLoadingButton] = useState(false);

    const [decryptionStatus, setDecryptionStatus] = useState("");
    const [animating, setAnimating] = useState(false);
    const [decryptedDob, setDecryptedDob] = useState("");
    const [decryptedCc, setDecryptedCc] = useState("");
    const [cipherDob, setCipherDob] = useState("");
    const [cipherCc, setCipherCc] = useState("");
    const [canReadDob, setCanReadDob] = useState(false);
    const [canReadCc, setCanReadCc] = useState(false);
    // --- init per user row
    useEffect(() => {
        setDecrypted(false);
        setCanReadDob(IAMService.hasOneRole("_tide_dob.selfdecrypt"));
        setCanReadCc(IAMService.hasOneRole("_tide_cc.selfdecrypt"));
        setCipherDob(user.attributes?.dob?.[0] || '');
        setCipherCc(user.attributes?.cc?.[0] || '');
    }, [user]);

    const handleDecrypt = async () => {
        const isUser = user.id === IAMService.getValueFromToken("sub") ? true : false;
        if (!isUser) {
            setDecryptionStatus("Access denied: You don't have decryption rights.");
            setTimeout(() => setDecryptionStatus(""), 3000);
            return;
        }
        let encryptedData = [];
        if (!canReadDob && !canReadCc) {
            // Show error if no read permissions at all
            setDecryptionStatus("Access denied: You don't have decryption rights.");
            setTimeout(() => setDecryptionStatus(""), 3000);
            return;
        };

        // Prepare to decrypt all at once as an array 
        if (canReadDob) {
            encryptedData.push({
                "encrypted": cipherDob,
                "tags": ["dob"]
            });
        };

        if (canReadCc) {
            encryptedData.push({
                "encrypted": cipherCc,
                "tags": ["cc"]
            });
        };

        setAnimating(true);
        setTimeout(async () => {

            if (encryptedData.length > 0) {
                setLoadingButton(true);
                const decryptedData = await IAMService.doDecrypt(encryptedData);
                // Set data to show at roughly same time, only decrypt the attributes user has read permissions to
                if (encryptedData.length === 2) {                // Yes DoB Read permission, Yes CC Read Permission
                    setDecryptedDob(decryptedData[0]);
                    setDecryptedCc(decryptedData[1]);
                }
                else if (encryptedData[0].tags[0] === "dob") {   // Yes DoB Read permission, No CC Read Permission
                    setDecryptedDob(decryptedData[0]);
                    setDecryptedCc(cipherCc);
                }
                else {                                          // No DoB Read permission, Yes CC Read Permission
                    setDecryptedDob(cipherDob);
                    setDecryptedCc(decryptedData[0]);
                }

                setDecrypted(true);
                setAnimating(false);
                setDecryptionStatus("Decrypted successfully!");
                setTimeout(() => setDecryptionStatus(""), 3000);
                setLoadingButton(false);
            }
            else {
                setDecryptedCc(cipherCc);                             // No DoB Read permission, No CC Read Permission
                setDecryptedDob(cipherDob);
                setLoadingButton(false);
            }
        }, 800);

    };

    return (
        <div className="border border-gray-300 rounded p-4 bg-white shadow-sm space-y-2">
            <div className="text-sm font-mono break-all">
                <strong className="block text-gray-600 text-xs uppercase mb-1">Username</strong>
                {user.username}
            </div>

            <div className="text-sm font-mono break-all">
                <strong className="block text-gray-600 text-xs uppercase mb-1">Date of Birth</strong>
                <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
                    {decrypted && cipherDob && canReadDob ? <DecryptingText text={decryptedDob} /> : cipherDob}
                </span>
            </div>

            <div className="text-sm font-mono break-all">
                <strong className="block text-gray-600 text-xs uppercase mb-1">Credit Card</strong>
                <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
                    {decrypted && cipherCc && canReadCc ? <DecryptingText text={decryptedCc} /> : cipherCc}
                </span>
            </div>

            <div className="flex items-center gap-3">

                <Button className="hover:bg-red-700" onClick={async () => await handleDecrypt()} disabled={decrypted ? decrypted : loadingButton}>
                    {decrypted ? "✓ Decrypted" : "Decrypt"}
                </Button>
                {
                    loadingButton
                        ? <div className="spinner" />
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

    const { baseURL, realm, contextLoading, overlayLoading } = useAppContext();

    const [users, setUsers] = useState([]);

    // Expandable extra databaseExposureTable information
    const [showExposureAccordion, setShowExposureAccordion] = useState(false);
    // Further expandable information
    const [showDeepDive, setShowDeepDive] = useState(false);

    // Show a loading screen when loading context (such as when refreshing browser) until finish
    // Fetch all user data when navigating
    useEffect(() => {
        if (!contextLoading) {
            getAllUsers();
        }

    }, [contextLoading])


    // Populate the Database Exposure cards, and set the current logged users
    const getAllUsers = async () => {
        const token = await IAMService.getToken();
        const users = await appService.getUsers(baseURL, realm, token);
        users.map(async (user) => {
            const unmanagedAttributes = await appService.getUserAttributes(baseURL, realm, user.id, token);
            user.attributes = {
                ...user.attributes,
                unmanagedAttributes
            }
        })
        setUsers(users);
    };

    return (
        !contextLoading && !overlayLoading
            ?
            <main className="flex-grow w-full pt-6 pb-16">
                <div className="w-full px-4 max-w-screen-md mx-auto flex flex-col items-stretch gap-4">

                    <div className="w-full max-w-3xl" />
                    <div>
                        <div className="relative pt-8 w-full">

                            <button
                                onClick={() => setShowExposureAccordion(x => !x)}
                                className="absolute top-0 right-0 text-2xl hover:scale-110 transition-transform"
                                aria-label="Toggle explanation"
                            >
                                {showExposureAccordion ? "🤯" : "🤔"}
                            </button>

                            <h3 className="text-2xl font-semibold">Database-Leak Drill</h3>

                            <p className="text-sm text-gray-600 mb-3">
                                Your user API&nbsp;
                                <a href="https://techcrunch.com/2025/03/31/api-testing-firm-apisec-exposed-customer-data-during-security-lapse/"
                                    target="_blank" rel="noopener noreferrer"
                                    className="underline text-blue-600">
                                    just leaked
                                </a>&nbsp;, S3 bucket&nbsp;
                                <a href="https://cybersecuritynews.com/86000-healthcare-staff-records-exposed/"
                                    target="_blank" rel="noopener noreferrer"
                                    className="underline text-blue-600">
                                    left public
                                </a>&nbsp;, a dev laptop&nbsp;
                                <a href="https://www.theverge.com/2023/2/28/23618353/lastpass-security-breach-disclosure-password-vault-encryption-update"
                                    target="_blank" rel="noopener noreferrer"
                                    className="underline text-blue-600">
                                    stolen
                                </a>&nbsp;, even your IAM vendor&nbsp;
                                <a href="https://www.informationweek.com/cyber-resilience/massive-okta-breach-what-cisos-should-know"
                                    target="_blank" rel="noopener noreferrer"
                                    className="underline text-blue-600">
                                    breached
                                </a>.
                                Normally you'd panic. Not anymore.
                            </p>

                            <AccordionBox
                                title="Why an exposed database is still unreadable"
                                isOpen={showExposureAccordion}
                            >
                                <p className="text-sm text-gray-600 mb-3">
                                    Data only decrypts for the user who just logged in on <em>this</em> device. Here's the chain that makes that guarantee:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <strong>Authentication can't be faked.</strong> BYOiD authenticates against a decentralized Fabric - it can't be circumvented, brute forced or faked - so "logged-in" really means logged-in.
                                    </li>
                                    <li>
                                        <strong>User-Device-Session binding.</strong> After BYOiD login, the browser holds a short-lived session key that ties the JWT to the device and session. Steal rows or even the JWT itself, and you still lack that key which makes the decryption process usable.
                                    </li>

                                    <li>
                                        <strong>Ownerless root cert.</strong> The Fabric signs tokens with a certificate no one controls; it adds the decrypt claim only if the user truly owns that role.
                                    </li>

                                    <li>
                                        <strong>Quorum-gated roles.</strong> Widening access demands multi-admin approval, enforced by the same root key, so no lone insider can mint a “read-all” token.
                                    </li>

                                    <li>
                                        <strong>Row-level blast radius.</strong> Even a legit user sees only their own data; a full dump collapses to one user, one device, one session.
                                    </li>
                                </ul>
                            </AccordionBox>


                        </div>



                    </div>
                    <div className="space-y-4">

                        {/* // Let the data load first */}
                        {users && users.length > 0
                            ? users.map(user => (
                                <DecryptedRow
                                    key={user.id}
                                    user={user}
                                    baseUrl={baseURL}
                                    realm={realm}
                                />
                            ))
                            : null}

                    </div>
                </div>
                <div className="h-10" />
            </main>
            : <LoadingSquareFullPage />
    );
}