import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typeorm", "pg"],
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;