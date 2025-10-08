import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Route to feature mapping - optimized for M01 completion
  const routeMap: Record<string, "M01" | "M02" | "M03"> = {
    "/core-ledger": "M01",
    "/journals": "M02",
    "/reports": "M03",
    "/reports/trial-balance": "M03",
  };

  // Find matching route
  const matchedRoute = Object.keys(routeMap).find(route =>
    path.startsWith(route)
  );

  if (!matchedRoute) return NextResponse.next();

  const featureKey = routeMap[matchedRoute]!; // Non-null assertion since we checked matchedRoute exists
  const featureState = (process.env[`NEXT_PUBLIC_FEATURE_${featureKey}`] || "off") as
    | "off" | "beta" | "on";

  // Redirect to coming soon page if feature is off
  if (featureState === "off") {
    url.pathname = "/sandbox/coming-soon";
    url.searchParams.set("module", featureKey);
    return NextResponse.rewrite(url);
  }

  // Add feature state to headers for components to use
  const response = NextResponse.next();
  response.headers.set("x-feature-state", featureState);
  response.headers.set("x-feature-key", featureKey);

  return response;
}

export const config = {
  matcher: [
    "/core-ledger/:path*",
    "/journals/:path*",
    "/reports/:path*",
    "/sandbox/:path*"
  ]
};

