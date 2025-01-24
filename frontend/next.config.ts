import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // enable static exports
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // for gh pages preview deployments
  images: {
    unoptimized: true, // required for static export
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/:path*'
      }
    ]
  }
};

export default nextConfig;