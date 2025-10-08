"use client";
import { useState } from "react";

const KEYS = ["M01", "M02", "M03"] as const;
const STATES = ["off", "beta", "on"] as const;

interface FlagPanelProps {
  flags: Record<string, string>;
  onFlagsChange: (flags: Record<string, string>) => void;
}

export function FlagPanel({ flags, onFlagsChange }: FlagPanelProps): React.JSX.Element {
  const [localFlags, setLocalFlags] = useState(flags);

  const handleFlagChange = (key: string, value: string) => {
    const newFlags = { ...localFlags, [key]: value };
    setLocalFlags(newFlags);
  };

  const handleSave = async () => {
    try {
      // In a real implementation, this would call the BFF API
      await fetch("/api/proxy/flags", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(localFlags),
      });
      onFlagsChange(localFlags);
      console.log("Feature flags saved:", localFlags);
    } catch (error) {
      console.error("Failed to save feature flags:", error);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold mb-3">Feature Flags</h3>
      <div className="space-y-3">
        {KEYS.map(k => (
          <div key={k} className="flex items-center justify-between">
            <label className="text-sm font-medium">{k}</label>
            <select
              className="rounded-md border border-white/10 bg-transparent px-3 py-1 text-sm"
              value={localFlags[k]}
              onChange={(e) => handleFlagChange(k, e.target.value)}
            >
              {STATES.map(s => (
                <option key={s} value={s} className="bg-gray-900">
                  {s === "on" ? "✅ On" : s === "beta" ? "🚧 Beta" : "⏳ Off"}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button 
        onClick={handleSave}
        className="mt-4 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
      >
        Save & Apply
      </button>
    </div>
  );
}
