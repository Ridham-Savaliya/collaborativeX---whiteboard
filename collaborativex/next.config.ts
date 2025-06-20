import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
    images: {
    domains: ["via.placeholder.com"], // Add the hostname here
  },
  
};

export default nextConfig;
