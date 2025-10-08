import Link from 'next/link';
import { getAllModules } from '@aibos/config';

export default function SandboxDashboard(): React.JSX.Element {
  const modules = getAllModules();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AIBOS Sandbox</h1>
        <p className="text-gray-600 text-lg">
          Development and testing environment for AIBOS ERP modules
        </p>
      </div>

      {/* Module Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{module.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{module.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                module.status === "on" ? "bg-green-100 text-green-800" : 
                module.status === "beta" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              }`}>
                {module.status === "on" ? "✅ Ready" : 
                 module.status === "beta" ? "🚧 Beta" : "⏳ Coming Soon"}
              </span>
            </div>

            <div className="space-y-3">
              {module.status === "on" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Features</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>• {module.endpoints.length} API endpoints</div>
                    <div>• {module.uiComponents.length} UI components</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {module.status === "on" ? (
                  <Link href={`/${module.id.toLowerCase().replace('m0', '')}-ledger`}>
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                      Launch Module
                    </button>
                  </Link>
                ) : (
                  <button className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed" disabled>
                    {module.status === "beta" ? "Beta Coming Soon" : "In Development"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/core-ledger">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
              Test Core Ledger (M01)
            </button>
          </Link>
          <button className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-md font-medium cursor-not-allowed" disabled>
            API Documentation (Coming Soon)
          </button>
        </div>
      </div>

      {/* Development Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Development Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• This is a sandbox environment for development and testing</div>
          <div>• Data may be reset periodically</div>
          <div>• Features are released gradually as they become ready</div>
          <div>• For production access, contact your system administrator</div>
        </div>
      </div>
    </div>
  );
}
