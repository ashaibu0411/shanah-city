import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SHA256_FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/**
 * Google Play App Signing fingerprint, not the debug or upload-key fingerprint.
 * Configure ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS in Vercel production
 * with one or more comma-separated SHA-256 fingerprints from Play Console.
 * Never invent or silently substitute a certificate fingerprint.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS || "")
    .split(",")
    .map(value => value.trim().toUpperCase())
    .filter(Boolean);
  if (!fingerprints.length || fingerprints.some(value => !SHA256_FINGERPRINT.test(value))) {
    return NextResponse.json({ error: "Android App Links verification is not configured." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json([{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "org.shanahcity.app",
      sha256_cert_fingerprints: [...new Set(fingerprints)],
    },
  }], {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
