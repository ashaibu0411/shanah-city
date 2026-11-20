import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Reduce Webpack peak memory on Vercel for the growing Shanah City app.
  experimental: { webpackMemoryOptimizations: true, cpus: 1 },
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
