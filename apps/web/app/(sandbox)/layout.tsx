export default function SandboxLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sandbox Banner */}
      <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/30 p-3 text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-800">
              SANDBOX
            </span>
            <span className="text-amber-800">
              <strong>Development Environment</strong> • Not production • Data may reset
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-amber-700">
            <span>M01: ✅ Active</span>
            <span>M02: ⏳ Coming Soon</span>
            <span>M03: ⏳ Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

