import QRCode from "qrcode";
import Link from "next/link";

export const metadata = { title: "Guest check-in QR codes | Shanah City" };
export const dynamic = "force-dynamic";

export default async function GuestCheckInCodesPage() {
  const url = "https://shanahcity.org/guest";
  const qr = await QRCode.toDataURL(url, { width: 520, margin: 2, errorCorrectionLevel: "H" });
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Shanah City · Welcome</p>
      <h1 className="mt-3 text-3xl font-bold">First-time visitor connection</h1>
      <p className="mx-auto mt-3 max-w-lg text-slate-600 dark:text-slate-300">
        Scan to connect with our welcome and Follow-Up Ministry team. No church app download or account is needed.
      </p>
      <div className="mx-auto mt-7 w-fit rounded-2xl bg-white p-5 shadow-sm">
        {/* Data URL is generated locally by the QR library; no guest data is sent to a QR service. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code for Shanah City guest connection form" width={320} height={320} />
      </div>
      <p className="mt-5 font-mono text-sm">shanahcity.org/guest</p>
      <Link href="/guest" className="mt-5 inline-block rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white">
        Open visitor form
      </Link>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
        Submissions appear in the existing Follow-Up Ministry guest queue, not a separate guest database.
      </p>
    </main>
  );
}
