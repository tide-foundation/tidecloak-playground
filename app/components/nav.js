"use client"; 

import IAMService from "../../lib/IAMService";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";              // NEW
import Button from "../components/button";

/**
 * Top navigation bar shown after login.
 */
export default function Nav() {
  const pathname = usePathname();
  const router   = useRouter();

  // Navigate only if we aren’t already on that route
  const handleNavigate = (route) => {
    if (pathname !== route) router.push(route);
  };

  // Utility to highlight the active button
  const getButtonClasses = (route) =>
    pathname === route ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100";

  // Hide nav on landing & failure pages
  if (pathname === "/" || pathname === "/fail") return null;

  return (
    <nav className="flex items-center gap-4 border-b border-gray-200 px-8 py-4">
      {/* Logo → home page */}
      <Link href="/home" className="inline-block">
        <img
          src="/playground-logo_nav.png"
          alt="Playground Logo"
          className="h-10 w-auto cursor-pointer"
        />
      </Link>

      <button
        onClick={() => handleNavigate("/user")}
        className={`px-4 py-2 rounded transition ${getButtonClasses("/user")}`}
      >
        User
      </button>

      <button
        onClick={() => handleNavigate("/databaseExposure")}
        className={`px-4 py-2 rounded transition ${getButtonClasses("/databaseExposure")}`}
      >
        Database Exposure
      </button>

      <button
        onClick={() => handleNavigate("/admin")}
        className={`px-4 py-2 rounded transition ${getButtonClasses("/admin")}`}
      >
        Administration
      </button>

      <Button onClick={() => IAMService.doLogout()}>Logout</Button>
    </nav>
  );
}
