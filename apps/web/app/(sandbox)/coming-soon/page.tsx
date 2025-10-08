import Link from 'next/link';

export default function ComingSoonPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-gray-600 mb-6">
            This module is currently under development and will be available soon.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Now</h3>
            <p className="text-gray-600 mb-4">Core Ledger (M01) is ready for testing</p>
            <Link href="/core-ledger">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
                Go to Core Ledger
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Development Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>M01 - Core Ledger</span>
                <span className="text-green-600 font-medium">✅ Ready</span>
              </div>
              <div className="flex justify-between">
                <span>M02 - Journal Entries</span>
                <span className="text-yellow-600 font-medium">🚧 In Progress</span>
              </div>
              <div className="flex justify-between">
                <span>M03 - Trial Balance</span>
                <span className="text-gray-500 font-medium">⏳ Planned</span>
              </div>
            </div>
          </div>

          <Link href="/sandbox">
            <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors">
              Back to Sandbox Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
