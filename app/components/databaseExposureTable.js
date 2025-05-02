 
import IAMService from "../../lib/IAMService";
import React, { useState, useEffect, useMemo } from "react";
import Button from "../components/button";

// Animation
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

function DecryptedRow({ isUser, user, username, dob, cc, canRead }) {
    const [decrypted, setDecrypted] = useState(false);
    const [decryptionStatus, setDecryptionStatus] = useState("");
    const [animating, setAnimating] = useState(false);
    const [decryptedDob, setDecryptedDob] = useState("");
    const [decryptedCc, setDecryptedCc] = useState("");

    useEffect(() => {
        setDecrypted(false);
    }, [user])

    // Calls on Decrypt button being selected to update the fields
    const handleDecrypt = () => {

    let dob;
    let cc;

    if (Array.isArray(user.attributes.dob)){
        dob = user.attributes.dob[0];
        console.log(dob);
    }
    else {
        dob = user.attributes.dob;
        console.log(dob);
    }

    if (Array.isArray(user.attributes.cc)){
        cc = user.attributes.cc[0];
        console.log(cc);
    }
    else {
        cc = user.attributes.cc;
        console.log(cc);
    }

    if (!isUser) {
        setDecryptionStatus("Access denied: You don't have decryption rights.");
        setTimeout(() => setDecryptionStatus(""), 3000);
        return;
    }

    if (!canRead) {
        setDecryptionStatus("Access denied: You lack read permission.");
        setTimeout(() => setDecryptionStatus(""), 3000);
        return;
    }

    setAnimating(true);
    setTimeout(async () => {
    const decryptedDobData = await IAMService.doDecrypt([
        {
        "encrypted": dob,
        "tags": ["dob"]
        }
    ])
    
    setDecryptedDob(decryptedDobData[0]); 

    const decryptedCcData = await IAMService.doDecrypt([
        {
            "encrypted": cc,
            "tags": ["cc"]
        }
    ])
    
        setDecryptedCc(decryptedCcData[0]); 

        setDecrypted(true);
        setAnimating(false);
        setDecryptionStatus("Decrypted successfully!");
        setTimeout(() => setDecryptionStatus(""), 3000);
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
            {isUser && decrypted && dob ? <DecryptingText text={decryptedDob} /> : user.attributes.dob}
            </span>
        </div>

        <div className="text-sm font-mono break-all">
            <strong className="block text-gray-600 text-xs uppercase mb-1">Credit Card</strong>
            <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {isUser && decrypted && cc ? <DecryptingText text={decryptedCc} /> : user.attributes.dob}
            </span>
        </div>

        <div className="flex items-center gap-3">
            <Button onClick={handleDecrypt} disabled={decrypted}>
            {decrypted ? "✓ Decrypted" : "Decrypt"}
            </Button>

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
 

// The Decryptable Cards
export default function DatabaseExposureTable({users}) {
    console.log("me too?");
    const memoUsers = useMemo(() => users, [users]);

    return (
        <div className="mt-6 space-y-6 pb-24 md:pb-36">
            {
                // Let the data load first
                memoUsers
                ?
                memoUsers.map((user, i) => (
                 
                  <DecryptedRow key={i}
                  isUser={user.attributes.vuid[0] === IAMService.getValueFromToken("vuid")}
                  user={user}
                  username={user.username}
                  dob={IAMService.hasOneRole("_tide_dob.read") ? user.attributes.dob : null}
                  cc={IAMService.hasOneRole("_tide_cc.read") ? user.attributes.cc : null}
                  canRead={IAMService.hasOneRole("_tide_dob.read") || IAMService.hasOneRole("_tide_cc.read")}
                  />
                ))
                : null
            }
        </div> 
    );
}