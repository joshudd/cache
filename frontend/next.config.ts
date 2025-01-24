import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '', // for gh pages preview deployments
  images: {
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