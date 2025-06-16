"use client";

import Link from "next/link";
import { FaUserCircle, FaDatabase, FaShieldAlt } from "react-icons/fa";

export default function HomePage() {
  const demos = [
    { title: "User privacy", href: "/user", icon: FaUserCircle },
    { title: "Database exposure", href: "/databaseExposure", icon: FaDatabase },
    { title: "Admin protection", href: "/admin", icon: FaShieldAlt },
  ];

  return (
    <main className="container mx-auto max-w-screen-lg px-4 py-12">
      <h1 className="text-center text-3xl font-bold">Choose your experience</h1>
      <p className="mb-10 mt-2 text-center text-gray-600">
        A few common scenarios, with <span className="font-semibold">uncommon</span> properties for you to play with.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map(({ title, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <div
              className="flex h-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center shadow-sm transition-all duration-200 group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:shadow-md"
            >
              {Icon && (
                <Icon className="h-10 w-10 text-gray-600 transition-transform duration-200 group-hover:scale-105 group-hover:text-blue-600" />
              )}
              <span className="text-lg font-semibold tracking-tight text-gray-800 group-hover:text-blue-700">
                {title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
