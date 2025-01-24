import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // remove static export for middleware support
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // for gh pages preview deployments
};

export default nextConfig;