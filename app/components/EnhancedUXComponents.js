import React from "react";

// Tooltip wrapper for explaining terms
export function TooltipWrapper({ label, tip }) {
  return (
    <span className="relative group inline-block">
      <span className="underline decoration-dotted cursor-help" title={tip}>
        {label}
      </span>
    </span>
  );
}

// Post-login BYOiD explainer
export function BYOiDExplainer({ isVisible }) {
  if (!isVisible) return null;
  return (
    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded">
      <h4 className="font-bold text-indigo-700 mb-2">You just used BYOiD 🚀</h4>
      <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
        <li>Your identity was proven using zero-knowledge proof.</li>
        <li>No password left your browser. Ever.</li>
        <li>Authentication was distributed across multiple nodes in a swarm.</li>
        <li>Only your session can use this login — not even Tide can replay it.</li>
      </ul>
    </div>
  );
}

// Visualizer for simulated decentralized key activity
export function FabricVisualizer({ activity }) {
  return (
    <div className="mt-4 border border-gray-300 rounded bg-white p-4 text-xs font-mono">
      <div className="text-gray-600 mb-2 font-semibold">🧠 Fabric Activity Log</div>
      <ul className="space-y-1">
        {activity.map((line, i) => (
          <li key={i} className="text-green-700">{line}</li>
        ))}
      </ul>
    </div>
  );
}

// Mode switcher for demo comparison
export function IAMToggle({ mode, setMode }) {
  return (
    <div className="flex items-center gap-4 mt-4">
      <label className="font-semibold text-sm">IAM Mode:</label>
      <select
        className="border px-2 py-1 rounded bg-white shadow-sm"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="tidecloak">TideCloak (Decentralized)</option>
        <option value="traditional">Traditional IAM (Centralized)</option>
      </select>
    </div>
  );
}

// Reset/replay button
export function ResetButton({ onReset }) {
  return (
    <button
      onClick={onReset}
      className="mt-6 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
    >
      🔄 Reset & Replay Flow
    </button>
  );
}
