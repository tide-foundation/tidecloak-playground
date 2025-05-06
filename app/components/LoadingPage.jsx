import {useState, useEffect} from 'react';
import './spinKit.css';

export default function LoadingPage({ isInitializing, setIsInitializing}) {

    const [currentStep, setCurrentStep] = useState(0);
    const [masterToken, setMasterToken] = useState(null);

    // Initialiser
    const steps = [
        'Activating license',
        'Creating user roles in TideCloak',
        'Seeding demo data',
        'Configuring permissions',
        'Finalizing setup',
    ];

    useEffect(() => {
        if (isInitializing){
            initialize();
        }
    }, [])

    const getMasterToken = async () => {
      const response = await fetch(`/api/getMasterToken`); 
      const data = await response.json();
      setMasterToken(data.body);
    
    };

    const initialize = () => {
        getMasterToken();
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
            {/* <ul className="list-disc list-inside space-y-2 text-gray-700">
                {steps.map((msg, i) => (
                    <li
                        key={i}
                        className={
                            i < currentIndex
                                ? 'opacity-50 line-through'
                                : i === currentIndex
                                    ? 'font-semibold'
                                    : ''
                        }
                    >
                        {msg}
                    </li>
                ))}
            </ul> */}
        </div>
    );
}