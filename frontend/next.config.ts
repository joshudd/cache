import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '', // for gh pages preview deployments
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? '', // ensure assets are loaded from correct path
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.spotifycdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.spotify.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;