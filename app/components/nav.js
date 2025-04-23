"use client"
import React, { useState, useEffect } from "react";
import IAMService from "../../lib/IAMService";
import appService from "../../lib/appService";
import { useAppContext } from "../context/context";
import { usePathname, useRouter } from "next/navigation";

import Button from "../components/button";

export default function Nav() {

    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        IAMService.initIAM(() => {
          if (IAMService.isLoggedIn()){

          }
          setLoading(false);
        });
      }, [])


    const handleLogout = () => {
        IAMService.doLogout();
    };

    const handleAdminButton = async () => {
        router.push(`/admin`);
    };


    return (
        !loading
        ?
        <>
        {IAMService.isLoggedIn() && pathname !== "/" && pathname !== "/fail" && (
            <nav className="flex justify-start gap-4 px-8 py-4 border-b border-gray-200">
              <button
                onClick={() => setPage("User")}
                className={`px-4 py-2 rounded transition ${pathname === "User" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
              >
                User
              </button>
              <button
                onClick={() => handleAdminButton()}
                className={`px-4 py-2 rounded transition ${pathname === "Admin" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
              >
                Administration
              </button>
              <Button onClick={handleLogout}>Logout</Button>
            </nav>
          )}
        </>
       : null
        
    )   
};