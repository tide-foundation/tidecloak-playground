"use client";

import { useState } from "react";
import Link from "next/link";
import { FaUserCircle, FaDatabase, FaShieldAlt } from "react-icons/fa";
import AccordionBox from "../components/accordionBox";

export default function HomePage() {
  const [showHomeAccordion, setShowHomeAccordion] = useState(false);

  const demos = [
    { title: "User privacy",       href: "/user",             icon: FaUserCircle },
    { title: "Database exposure",  href: "/databaseExposure", icon: FaDatabase   },
    { title: "Admin protection",   href: "/admin",            icon: FaShieldAlt },
  ];

  return (
    <main className="container mx-auto max-w-screen-lg px-4 py-12">
      <h1 className="text-center text-3xl font-bold">Choose your experience</h1>
      <p className="mb-4 mt-2 text-center text-gray-600">
        A few common scenarios, with <span className="font-semibold">uncommon</span> properties for you to experience.
      </p>

      {/* ─── Toggle emoji ─────────────────────────────────────────── */}
      <div className="relative mb-2 flex justify-center">
        <button
          onClick={() => setShowHomeAccordion(!showHomeAccordion)}
          className="text-2xl hover:scale-110 transition-transform"
          aria-label="Toggle TideCloak explanation"
        >
          {showHomeAccordion ? "🤯" : "🤔"}
        </button>
      </div>

      {/* ─── Accordion content ───────────────────────────────────── */}
      <AccordionBox title="Why TideCloak lets you build without breach anxiety" isOpen={showHomeAccordion}>
        <p>
          These properties combine to give you peace of mind that no single breach, no matter how nasty, will result in catastrophic data exposure or privilege abuse. The breach is inevitable, but not the consequences:
        </p>

        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>BYOiD</strong> - decentralized, zero-knowledge login; passwords are never stored or exposed, and can't be brute forced.</li>
          <li><strong>Quorum-guarded Governance</strong> - a permission granted is a permission intended, as it must pass majority admin approval; no more god-mode.</li>
          <li><strong>Edge Decryption</strong> - data decrypts only on the device of an authenticated and authorized user, anywhere else it's garble.</li>
          
        </ul>

        <p className="mt-2">Pick an experience below to watch each safeguard in action.</p>
      </AccordionBox>

      {/* ─── Demo tiles ───────────────────────────────────────────── */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map(({ title, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <div className="flex h-full flex-col items-center justify-center gap-4
                            rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center
                            shadow-sm transition-all duration-200
                            group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:shadow-md">
              <Icon className="h-10 w-10 text-gray-600 transition-transform duration-200 group-hover:scale-105 group-hover:text-blue-600" />
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
