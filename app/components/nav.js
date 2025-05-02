"use client"
import React from "react";
import IAMService from "../../lib/IAMService";
import { usePathname, useRouter } from "next/navigation";

import Button from "../components/button";

export default function Nav() {

    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
      IAMService.doLogout();
    };

    const handleAdminButton = () => {
      if (pathname !== "/admin"){
        router.push("/admin");
      }
    };

    const handleUserButton = () => {
      if (pathname !== "/user"){
        router.push("/user");
      }
    };


    return (
      <>
      {pathname !== "/" && pathname !== "/fail" && (
          <nav className="flex justify-start gap-4 px-8 py-4 border-b border-gray-200">
            <button
              onClick={() => handleUserButton()}
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
    )   
};