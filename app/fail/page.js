"use client"
import React, { useEffect } from "react";
import IAMService from "/lib/IAMService";

export default function FailedPage() {
  // If user authenticated but without proper credentials, present this page
  useEffect(() => {
    IAMService.initIAM();
  }, []);

  const handleLogout = () => {
    // Allow user to log out and start over
    IAMService.doLogout();
  };

  return (
    <div>
      <h1>Validation failed</h1>
      <p>User not allowed. Log in with a priviledged user.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}