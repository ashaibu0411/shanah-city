import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Reduce peak memory used by webpack during Next.js 15 Vercel builds.
  // Does not skip lint, TypeScript validation or affect runtime behavior.
  experimental: {
    webpackMemoryOptimizations: true,
  },
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
