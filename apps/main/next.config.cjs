/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_BFF_BASE_URL: process.env.NEXT_PUBLIC_BFF_BASE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WEB_SANDBOX_BASE_URL: process.env.NEXT_PUBLIC_WEB_SANDBOX_BASE_URL || 'http://localhost:3002',
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_BFF_BASE_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
