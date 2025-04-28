// File: EnhancementsPreview.jsx

import React, { useState } from "react";
import { BYOiDExplainer, FabricVisualizer, IAMToggle, ResetButton, TooltipWrapper } from "./EnhancedUXComponents";

export default function EnhancementsPreview() {
  const [iamMode, setIamMode] = useState("tidecloak");
  const [byoidVisible, setByoidVisible] = useState(false);
  const [fabricActivity, setFabricActivity] = useState([]);

  const triggerDecryption = () => {
    setFabricActivity([
      "🔐 Request received from user session.",
      "🧩 Node A validated session key fragment.",
      "🧠 Node F verified zero-knowledge identity proof.",
      "🔑 Node M partially processed decryption request.",
      "✅ Result compiled client-side with no full key ever assembled."
    ]);
  };

  const resetFlow = () => {
    setIamMode("tidecloak");
    setByoidVisible(false);
    setFabricActivity([]);
  };

  return (
    <div className="p-8 space-y-6 font-sans">
      <h1 className="text-3xl font-bold text-gray-800">🧪 TideCloak Enhancements Preview</h1>

      <IAMToggle mode={iamMode} setMode={setIamMode} />

      <div className="mt-6 border rounded p-6 bg-white shadow space-y-4">
        <h2 className="text-xl font-semibold">BYOiD Authentication Demo</h2>
        <button
          onClick={() => setByoidVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Simulate BYOiD Login
        </button>
        <BYOiDExplainer isVisible={byoidVisible} />
      </div>

      <div className="border rounded p-6 bg-white shadow space-y-4">
        <h2 className="text-xl font-semibold">Simulated Fabric Activity</h2>
        <p className="text-sm text-gray-600">
          Click below to simulate a cryptographic operation like decrypting a field using <TooltipWrapper label="MPC" tip="Multi-Party Computation ensures no single node ever holds the full key." />
        </p>
        <button
          onClick={triggerDecryption}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Trigger Fabric Decryption
        </button>
        <FabricVisualizer activity={fabricActivity} />
      </div>

      <ResetButton onReset={resetFlow} />

      <footer className="text-sm text-gray-500 border-t pt-4 mt-6">
        You can integrate these enhancements modularly into your main app. See the code in <code>EnhancedUXComponents.js</code>
      </footer>
    </div>
  );
}