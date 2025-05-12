import {useState, useEffect} from 'react';
import './spinKit.css';

export default function LoadingPage({ isInitializing, setIsInitializing}) {

    const [currentStep, setCurrentStep] = useState(0);
    const [masterToken, setMasterToken] = useState(null);
    

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
        if (isInitializing){
            try {
                getMasterToken();
            }
            catch (error){
                console.log(error);
            }
        }
    }, []);

    useEffect(() => {
        if (masterToken){
            initialize();
        }
    }, [masterToken]);

    // Master token required for each step in initialisation
    const getMasterToken = async () => {
        const response = await fetch(`/api/getMasterToken`, {
            method: "GET"
        }); 
        const data = await response.json();
        setMasterToken(data.body);
    
        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to fetch master token.");
        }
    };

    // Create the demo realm using the settings provided in test-realm.json
    const createRealm = async () => {
        setCurrentStep(1);
        const response = await fetch(`/api/createRealm`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        });
        
        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to create the realm.");
        }
    };

    // On error during initialisation process remove the IDP first, if IDP doesn't attempt to delete the realm
    const deleteIDP = async () => {
        
        const response = await fetch(`/api/deleteIDP`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to delete the IDP, manual deletion of IDP then realm required via Keycloak.");
        }
    };

    // On error during initialisation delete the realm after removing the IDP
    const deleteRealm = async () => {
        const response = await fetch(`/api/deleteRealm`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to delete the realm, manual deletion of realm required via Keycloak.");
        }
    }

    // Activate the Tide IDP License to enable IGA
    const getLicense = async ()  => {
        setCurrentStep(2);
        const response = await fetch(`/api/getLicense`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to activate IDP license.");
        }
    }

    // Enable IGA (activate once and leave on)
    const toggleIGA = async () => {
        const response = await fetch(`/api/toggleIGA`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to toggle IGA on.");
        }
    }

    // Create 5 users including the demo user
    const createUsers = async () => {
        setCurrentStep(3);
        const response = await fetch(`/api/createUsers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to create users.");
        }
    }

    // Assign the demo user the minimum realm roles required
    const assignRealmRoles = async () => {
        setCurrentStep(4);
        const response = await fetch(`/api/assignRealmRoles`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to assign roles to the demo user.");
        }
    }

    // Approve and Commit all Clients change requests
    const commitClients = async () => {
        const response = await fetch(`/api/commitClients`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to approve and commit clients.");
        }
    }

    // Update the Custom Domain URL for the Tide Enclave to work
    const updateCustomDomainURL = async () => {
        setCurrentStep(5);
        const response = await fetch(`/api/updateCustomDomainURL`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to update the Custom Domain URL for the Tide IDP.");
        }
    }

    // Sign the new settings after updating the Custom Domain URL
    const signSettings = async () => {
        const response = await fetch(`/api/signSettings`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to sign the realm settings.");
        }
    }

    // Sign the new settings after updating the Custom Domain URL
    const getAdapter = async () => {
        const response = await fetch(`/api/getAdapter`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to get adapter for the client.");
        }
    }

    // Sign the new settings after updating the Custom Domain URL
    const inviteUser = async () => {
        const response = await fetch(`/api/inviteUser`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${masterToken}`
            }
        })

        if (!response.ok){
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed generate Tide invite link.");
        }

        const data = await response.json();
    }
    
    const initialize = async () => {
        try {
            await createRealm();
            await getLicense();
            await toggleIGA();
            await createUsers();
            await inviteUser();
            await assignRealmRoles();
            await commitClients();
            await updateCustomDomainURL();
            await signSettings();
            await getAdapter();

            setIsInitializing(false);
        }
        catch (error){
            // Delete IDP then realm if an error occurs in initialisation in preparation for restarting the process
            console.log(error);
            await deleteIDP();
            await deleteRealm();
            // Reset steps
            setCurrentStep(0);
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
            <ul className="list-disc list-inside space-y-2 text-gray-700">
                {steps.map((msg, i) => (
                    <li
                        key={i}
                        className={
                            i < currentStep
                                ? 'opacity-50 line-through'
                                : i === currentStep
                                    ? 'font-semibold'
                                    : ''
                        }
                    >
                        {msg}
                    </li>
                ))}
            </ul>
        </div>
    );
}