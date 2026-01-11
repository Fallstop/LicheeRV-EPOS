import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  crossOrigin: "anonymous",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.akahu.io",
      },
      {
        protocol: "https",
        hostname: "**.akahu.nz",
      },
    ],
  },
};

export default nextConfig;
