export type FlagState = "off" | "beta" | "on";
export type FeatureKey = "M01" | "M02" | "M03";

export interface FeatureFlags {
  M01: FlagState;
  M02: FlagState;
  M03: FlagState;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  M01: "on",    // Core Ledger - Ready for production
  M02: "off",   // Journal Entries - Not implemented yet
  M03: "off",   // Trial Balance - Not implemented yet
};

export interface ModuleStatus {
  id: FeatureKey;
  name: string;
  description: string;
  status: FlagState;
  lastUpdated: string;
  endpoints: string[];
  uiComponents: string[];
}

export const MODULE_REGISTRY: Record<FeatureKey, ModuleStatus> = {
  M01: {
    id: "M01",
    name: "Core Ledger",
    description: "Chart of Accounts, Account Hierarchies, Account Management",
    status: "on",
    lastUpdated: "2025-01-07",
    endpoints: [
      "GET /api/core-ledger/accounts",
      "POST /api/core-ledger/accounts", 
      "GET /api/core-ledger/accounts/[id]",
      "PUT /api/core-ledger/accounts/[id]",
      "DELETE /api/core-ledger/accounts/[id]",
      "GET /api/core-ledger/accounts/hierarchy",
      "POST /api/core-ledger/accounts/[id]/reparent"
    ],
    uiComponents: [
      "Chart of Accounts Page",
      "Account Detail Page", 
      "Account Hierarchy Page",
      "Create Account Modal",
      "Account Tree Component"
    ]
  },
  M02: {
    id: "M02",
    name: "Journal Entries",
    description: "Journal Entry Creation, Batch Posting, Entry Validation",
    status: "off",
    lastUpdated: "TBD",
    endpoints: [],
    uiComponents: []
  },
  M03: {
    id: "M03", 
    name: "Trial Balance",
    description: "Trial Balance Reports, Period Management, Financial Statements",
    status: "off",
    lastUpdated: "TBD",
    endpoints: [],
    uiComponents: []
  }
};

export function getModuleStatus(key: FeatureKey): ModuleStatus {
  return MODULE_REGISTRY[key];
}

export function getAllModules(): ModuleStatus[] {
  return Object.values(MODULE_REGISTRY);
}

export function getActiveModules(): ModuleStatus[] {
  return getAllModules().filter(module => module.status === "on");
}

export function getBetaModules(): ModuleStatus[] {
  return getAllModules().filter(module => module.status === "beta");
}

