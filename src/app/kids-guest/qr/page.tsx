import { ShareGuestQR } from "@/components/guest/ShareGuestQR";
import QRCode from "qrcode";
import Link from "next/link";

export const metadata = { title: "Shanah Kids guest QR | Shanah City" };
export const dynamic = "force-dynamic";

export default async function KidsGuestQRPage() {
  const qr = await QRCode.toDataURL("https://shanahcity.org/kids-guest", { width: 520, margin: 2, errorCorrectionLevel: "H" });
  return (
    <main className="mx-auto max-w-xl px-5 py-10 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Shanah City</p>
      <h1 className="mt-3 text-3xl font-bold">Shanah Kids · Guest arrival</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">Scan to let the welcome team know you're here. No app download or account needed. Please see a teacher to complete secure child check-in.</p>
      <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code to open Shanah Kids guest arrival form" width={320} height={320} />
      </div>
      <p className="mt-4 font-mono text-sm">shanahcity.org/kids-guest</p>
      <ShareGuestQR url="https://shanahcity.org/kids-guest" label="Shanah Kids Guest Arrival" />
      <Link href="/kids-guest" className="mt-5 inline-block rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white">Open guest form</Link>
    </main>
  );
}
