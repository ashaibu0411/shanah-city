import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "scontent-den2-1.xx.fbcdn.net" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
