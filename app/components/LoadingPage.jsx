import { useState, useEffect } from "react";
import "../styles/spinKit.css";
import "../styles/spinner.css";

/**
 * Initilizer to set up the realm with default settings
 * @param {boolean} isInitializing - display initializer if true
 * @param {function} setIsInitializing - turn off the initializer once completed
 * @param {function} setOverlayLoading - turn on loading screen when completed to load back to login screen
 * @returns {JSX.Element} - HTML component for the initializer screen 
 */
export default function LoadingPage({ isInitializing, setIsInitializing, setOverlayLoading }) {

    const [currentStep, setCurrentStep] = useState(0);

    // Initialiser
    const steps = [
        "Getting Token",
        "Creating Realm",
        "Activating license",
        "Seeding demo data",
        "Configuring permissions",
        "Finalizing setup",
    ];

    useEffect(() => {
        if (isInitializing) {
            try {
                initialize();
            }
            catch (error) {
                console.log(error);
            }
        }
    }, []);


    // Create the demo realm using the settings provided in test-realm.json
    const createRealm = async () => {
        setCurrentStep(1);
        const response = await fetch(`/api/createRealm`, {
            method: "GET",
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to create the realm.");
        }
    };

    // On error during initialisation process remove the IDP first, if IDP doesn't attempt to delete the realm
    const deleteIDP = async () => {
        const response = await fetch(`/api/deleteIDP`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to delete the IDP, manual deletion of IDP then realm required via Keycloak.");
        }
    };

    // On error during initialisation delete the realm after removing the IDP
    const deleteRealm = async () => {
        const response = await fetch(`/api/deleteRealm`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to delete the realm, manual deletion of realm required via Keycloak.");
        }
    }

    // Activate the Tide IDP License to enable IGA
    const getLicense = async () => {
        setCurrentStep(2);
        const response = await fetch(`/api/getLicense`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to activate IDP license.");
        }
    }

    // Enable IGA (activate once and leave on)
    const toggleIGA = async () => {
        const response = await fetch(`/api/toggleIGA`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to toggle IGA on.");
        }
    }

    // Create 5 users including the demo user
    const createUsers = async () => {
        setCurrentStep(3);
        const response = await fetch(`/api/createUsers`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to create users.");
        }
    }

    // Assign the demo user the minimum realm roles required
    const assignRealmRoles = async () => {
        setCurrentStep(4);
        const response = await fetch(`/api/assignRealmRoles`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to assign roles to the demo user.");
        }
    }

    // Approve and Commit all Clients change requests
    const commitClients = async () => {
        setCurrentStep(5);
        const response = await fetch(`/api/commitClients`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to approve and commit clients.");
        }
    }

    // Update the Custom Domain URL for the Tide Enclave to work
    const updateCustomDomainURL = async (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        const url = `/api/updateCustomDomainURL${qs ? '?' + qs : ''}`;

        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update domain URL');
        }
        return response;
    };

    // Upload background and logo image to tidecloak
    const uploadImages = async () => {
        const response = await fetch(`/api/uploadImages`, {
            method: "POST",
        })

        const data = await response.json();
        if (!response.ok || data.success !== true) {
            throw new Error(data.message || 'Upload failed');
        }
    }

    // Sign the new settings after updating the Custom Domain URL
    const signSettings = async () => {
        const response = await fetch(`/api/signSettings`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to sign the realm settings.");
        }
    }

    // Sign the new settings after updating the Custom Domain URL
    const getAdapter = async () => {
        const response = await fetch(`/api/getAdapter`, {
            method: "GET",

        })

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to get adapter for the client.");
        }
    }

    let restartCounter = 0;

    const initialize = async () => {
        try {
            await createRealm();
            await getLicense();
            await toggleIGA();
            await createUsers();
            await assignRealmRoles();
            await commitClients();
            await updateCustomDomainURL();
            await uploadImages();
            await signSettings();
            await updateCustomDomainURL({linkedTide: true});
            await getAdapter();

            // Load out of the initializer first then stop it to prevent Login screen appearing and giving context time to load 
            setOverlayLoading(true);
            setIsInitializing(false);
            
        }
        catch (error) {
            // Delete IDP then realm if an error occurs in initialisation in preparation for restarting the process
            console.log(error);
            await deleteIDP();
            await deleteRealm();
            // Reset steps
            setCurrentStep(0);


            restartCounter = restartCounter + 1;

            console.log("Times restarted: " + restartCounter);

            // If it fails on step 1 (createRealm) restart initalizer 
            if (restartCounter < 2) {
                await initialize();
            }
            else {
                restartCounter = 0;
            }

        }

    };


    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
            <div className="sk-cube-grid mb-4">
                <div className="sk-cube sk-cube1" />
                <div className="sk-cube sk-cube2" />
                <div className="sk-cube sk-cube3" />
                <div className="sk-cube sk-cube4" />
                <div className="sk-cube sk-cube5" />
                <div className="sk-cube sk-cube6" />
                <div className="sk-cube sk-cube7" />
                <div className="sk-cube sk-cube8" />
                <div className="sk-cube sk-cube9" />
            </div>

            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Initializing your demo app
            </h1>
            <ul className="list-inside space-y-2 text-gray-700">
                {steps.map((msg, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                            {i < currentStep ? (
                                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            ) : i === currentStep ? (
                                <div className="spinner"/>
                            ) : (
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            )}
                        </div>
                        <span
                            className={
                                i < currentStep
                                    ? "opacity-50 line-through"
                                    : i === currentStep
                                        ? "font-semibold text-blue-700"
                                        : ""
                            }
                        >
                            {msg}
                        </span>
                    </li>
                ))}
            </ul>

        </div>
    );
}
