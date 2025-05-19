import IAMService from "../../lib/IAMService";
import { useState, useEffect, useMemo } from "react";
import Button from "../components/button";
import {useAppContext} from '../context/context'

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

function DecryptedRow({ isUser, user, username, dob, cc }) {
    const [decrypted, setDecrypted] = useState(false);
    const [decryptionStatus, setDecryptionStatus] = useState("");
    const [animating, setAnimating] = useState(false);
    const [decryptedDob, setDecryptedDob] = useState("");
    const [decryptedCc, setDecryptedCc] = useState("");
    const [canReadDob, setCanReadDob] = useState();
    const [canReadCc, setCanReadCc] = useState();

    // If new user data arrives reset to potentially decrypt again
    useEffect(() => {
        setDecrypted(false);
        setCanReadDob(IAMService.hasOneRole("_tide_dob.read"));
        setCanReadCc(IAMService.hasOneRole("_tide_cc.read"));
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
            setDecryptionStatus("Access denied: You lack read permission.");
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
            const decryptedData = await IAMService.doDecrypt(encryptedData);
            
            // Set data to show at roughly same time, only decrypt the attributes user has read permissions to
            if (encryptedData.length === 2){
                setDecryptedDob(decryptedData[0]); 
                setDecryptedCc(decryptedData[1]); 
            }
            else if (encryptedData[0].tags[0] === "dob"){   // Yes DoB Read permission, No CC Read Permission
                setDecryptedDob(decryptedData[0]); 
                setDecryptedCc(cc);
            }
            else {                                          // No DoB Read permission, Yes CC Read Permission
                setDecryptedDob(dob); 
                setDecryptedCc(decryptedData[1]); 
            }

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
export default function DatabaseExposureTable({users, loggedUser, encryptedDob, encryptedCc}) {
    // Memorise the current array, only rerender if this array changes
    
    const memoUsers = useMemo(() => users, [users]);
    const {contextLoading} = useAppContext();
   
    // Swap first position with logged in user to put them on top of the stack
    for (let i = 0; i < memoUsers.length; i++) {
        if (i !== 0 && memoUsers[i].id === loggedUser.id) {
            const temp = memoUsers[0];
            memoUsers[0] = memoUsers[i];
            memoUsers[i] = temp;
            break;
        }
    }
    

    return (
        <div className="mt-6 space-y-6 pb-24 md:pb-36">
            {
                // Let the data load first
                memoUsers && !contextLoading
                ?
                memoUsers.map((user, i) => (
                    
                  <DecryptedRow key={i}
                  isUser={user.attributes?.vuid
                    ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? true : false
                    : false}
                   user={user}
                  username={user.username}
                  dob={user.attributes?.vuid
                    ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? encryptedDob : user.attributes.dob
                    : user.attributes?.dob}
                  cc={user.attributes?.vuid
                    ? user.attributes.vuid[0] === IAMService.getValueFromToken("vuid") ? encryptedCc : user.attributes.cc
                    : user.attributes?.cc}
                  />
                ))
                : null
            }
        </div> 
    );
}