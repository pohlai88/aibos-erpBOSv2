"use client";
import Link from "next/link";

interface SandboxLauncherProps {
  route: string;
  tenant?: string;
  moduleName: string;
  variant?: "primary" | "secondary";
}

export function SandboxLauncher({ route, tenant, moduleName, variant = "secondary" }: SandboxLauncherProps): React.JSX.Element {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_SANDBOX_BASE_URL || 'http://localhost:3002';
  const url = new URL(route, baseUrl);
  
  if (tenant) {
    url.searchParams.set("tenant", tenant);
  }

  const buttonClass = variant === "primary" 
    ? "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    : "w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-colors";

  return (
    <Link href={url.toString()} target="_blank" className={buttonClass}>
      {variant === "primary" ? "🚀 " : "🔗 "}{moduleName}
    </Link>
  );
}
