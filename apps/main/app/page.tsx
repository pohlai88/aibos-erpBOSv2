"use client";
import { useState, useEffect } from 'react';
import { getAllModules, type ModuleStatus } from '@aibos/config';
import { FlagPanel } from './components/FlagPanel';
import { TenantSwitcher } from './components/TenantSwitcher';
import { SandboxLauncher } from './components/SandboxLauncher';

export default function MainDashboard(): React.JSX.Element {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('sandbox');
  const [flags, setFlags] = useState<Record<string, string>>({
    M01: 'on',
    M02: 'off',
    M03: 'off'
  });

  useEffect(() => {
    setModules(getAllModules());
  }, []);

  const handleFlagChange = async (newFlags: Record<string, string>) => {
    setFlags(newFlags);
    // In a real implementation, this would call the BFF API
    console.log('Feature flags updated:', newFlags);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AIBOS Main Dev Sandbox</h1>
              <p className="text-gray-400 text-sm mt-1">
                Development control center and testing dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                <div>BFF: {process.env.NEXT_PUBLIC_BFF_BASE_URL || 'localhost:3000'}</div>
                <div>Web: {process.env.NEXT_PUBLIC_WEB_SANDBOX_BASE_URL || 'localhost:3002'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <FlagPanel flags={flags} onFlagsChange={handleFlagChange} />
            <TenantSwitcher
              selectedTenant={selectedTenant}
              onTenantChange={setSelectedTenant}
            />
          </div>

          {/* Right Column - Module Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module Status Cards */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold mb-4">Module Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <div key={module.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{module.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${module.status === 'on' ? 'bg-green-500/20 text-green-400' :
                          module.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                        {module.status === 'on' ? '✅ Ready' :
                          module.status === 'beta' ? '🚧 Beta' : '⏳ Off'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {module.status === 'on' && (
                        <div className="text-xs text-gray-400">
                          <div>• {module.endpoints.length} API endpoints</div>
                          <div>• {module.uiComponents.length} UI components</div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {module.status === 'on' ? (
                          <SandboxLauncher
                            route={`/${module.id.toLowerCase().replace('m0', '')}-ledger`}
                            tenant={selectedTenant}
                            moduleName={module.name}
                          />
                        ) : (
                          <button
                            className="px-3 py-1 rounded-md border border-white/10 bg-transparent text-sm text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            {module.status === 'beta' ? 'Beta Soon' : 'In Development'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SandboxLauncher
                  route="/sandbox"
                  tenant={selectedTenant}
                  moduleName="Full Sandbox"
                  variant="primary"
                />
                <SandboxLauncher
                  route="/core-ledger"
                  tenant={selectedTenant}
                  moduleName="Core Ledger Only"
                  variant="secondary"
                />
              </div>
            </div>

            {/* Development Info */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Development Information</h3>
              <div className="text-sm text-blue-300 space-y-1">
                <div>• This is the main development control center</div>
                <div>• Use feature flags to control module availability</div>
                <div>• Switch tenants to test different data scenarios</div>
                <div>• API tester allows direct endpoint testing</div>
                <div>• All changes are applied to the sandbox environment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
