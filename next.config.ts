import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Reduce Webpack peak memory on Vercel for the growing Shanah City app.
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
    // The Next.js memory profiler cannot run with the separate Webpack build worker.
    // Only disable the worker for an explicitly invoked diagnostic build.
    ...(process.env.SHANAH_BUILD_MEMORY_DIAGNOSTICS === "1"
      ? { webpackBuildWorker: false }
      : {}),
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
