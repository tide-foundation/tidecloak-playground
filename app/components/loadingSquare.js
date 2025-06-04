// app/components/loadingSquare.tsx
"use client";

import { useEffect } from "react";

export function LoadingSquareFullPage() {
  // Add “no-scroll” to <body> immediately on mount
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90"
      style={{ pointerEvents: "none" }}
    >
      <div className="sk-cube-grid mb-4">
        <div className="sk-cube-grid mb-4" />
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
    </div>
  );
}
