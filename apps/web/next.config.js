/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Router is default in 14, keep SWC (stable). Turn on Turbopack only if you want to test it.
  // experimental: { turbo: { rules: {} } },
  typescript: {
    // Don't allow prod builds with TS errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't allow prod builds with lint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
