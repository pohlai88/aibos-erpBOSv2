"use client";

interface TenantSwitcherProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
}

export function TenantSwitcher({ selectedTenant, onTenantChange }: TenantSwitcherProps): React.JSX.Element {
  const tenants = [
    { id: 'sandbox', name: 'Sandbox', description: 'Development data with sample accounts' },
    { id: 'empty', name: 'Empty', description: 'Clean slate for testing' },
    { id: 'seed-heavy', name: 'Seed Heavy', description: 'Large dataset for performance testing' }
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold mb-3">Tenant Environment</h3>
      <div className="space-y-2">
        {tenants.map(tenant => (
          <button
            key={tenant.id}
            onClick={() => onTenantChange(tenant.id)}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              selectedTenant === tenant.id 
                ? "border-blue-500/50 bg-blue-500/10 text-blue-400" 
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            <div className="font-medium">{tenant.name}</div>
            <div className="text-xs text-gray-400">{tenant.description}</div>
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        Current: <span className="font-medium">{selectedTenant}</span>
      </div>
    </div>
  );
}
