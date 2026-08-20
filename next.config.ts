import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
