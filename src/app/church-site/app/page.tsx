import type { Metadata } from "next";
import QRCode from "qrcode";
import { ChurchPageIntro } from "@/components/church-site/ChurchSiteFrame";

const APPLE_URL = "https://apps.apple.com/us/app/shana-city/id6802737530";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=org.shanahcity.app";
const HUB_URL = "https://shanahcity.org/app";

export const metadata: Metadata = {
  title: "Download the Shanah City App | Shanah City Church",
  description: "Download the official Shanah City church app on iPhone or Android. Enjoy sermons, devotionals, the church calendar and community in one place.",
  alternates: { canonical: HUB_URL },
  openGraph: {
    title: "Take Shanah City With You — Download the App",
    description: "Download the official Shanah City app for iPhone and Android.",
    url: HUB_URL,
    images: [{url:"/app-store-screenshots/01-home-1242x2688.png",width:1242,height:2688}],
  },
};

const features = [
  ["Live worship & messages", "Watch services and revisit inspiring sermons."],
  ["Daily devotionals", "Grow your faith throughout the week."],
  ["Events & announcements", "Stay informed about what is happening at Shanah City."],
  ["Church family", "Connect with groups, ministries, and the community."],
];

export default async function ChurchDownloadAppPage() {
  const qr = await QRCode.toDataURL(HUB_URL, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {dark:"#082e4d", light:"#ffffff"},
  });

  return <main>
    <section className="overflow-hidden bg-[#092f50] px-6 py-16 text-white sm:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1210px] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.23em] text-[#f6cc86]">Our church. Your everyday.</p>
          <h1 className="mt-5 max-w-[700px] font-display text-[clamp(3.5rem,6vw,6rem)] font-semibold leading-[1.02] tracking-[-0.05em]">Take Shanah City <em className="text-[#f4d09a]">with you.</em></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">Worship, devotionals, sermons, events, weekly announcements and your church family—all in one place. Get the official Shanah City app for free.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={APPLE_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-white px-6 py-3 text-[#092f50] shadow-lg transition hover:bg-[#e8f5fa]" aria-label="Download the official Shanah City app from the Apple App Store">
              <span className="text-3xl" aria-hidden="true">●</span><span><span className="block text-[11px] font-bold">Download on the</span><span className="block text-lg font-extrabold leading-5">App Store</span></span>
            </a>
            <a href={ANDROID_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/40 bg-[#12446a] px-6 py-3 text-white transition hover:bg-[#1b577e]" aria-label="Get the official Shanah City app on Google Play">
              <span className="text-2xl" aria-hidden="true">▶</span><span><span className="block text-[11px] font-bold">GET IT ON</span><span className="block text-lg font-extrabold leading-5">Google Play</span></span>
            </a>
          </div>
          <p className="mt-5 text-sm text-blue-100">Available for iPhone and Android. No cost to download.</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row lg:gap-6">
          <div className="relative w-[230px] shrink-0 rounded-[42px] border-[9px] border-[#102236] bg-[#152a40] p-[5px] shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:w-[260px]">
            <div className="absolute left-1/2 top-[12px] z-10 h-[16px] w-[82px] -translate-x-1/2 rounded-full bg-[#102236]"/>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app-store-screenshots/01-home-1242x2688.png" alt="Preview of the Shanah City mobile app home screen" className="aspect-[1242/2688] w-full rounded-[29px] object-cover"/>
          </div>
          <div className="rounded-[24px] bg-white p-5 text-center text-[#092f50] shadow-2xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.13em]">Scan to download</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code linking to shanahcity.org/app, the official Shanah City app download page" className="mx-auto h-[152px] w-[152px]"/>
            <p className="mt-3 text-xs font-bold">shanahcity.org/app</p>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-white px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-[1210px]">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#086c9e]">Everything you need to stay connected</p>
        <h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.2rem)] font-semibold tracking-[-.045em]">Church goes beyond Sunday.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title,body],index)=><article key={title} className="rounded-[22px] border border-slate-200 bg-[#f8fafb] p-7"><span className="text-xs font-extrabold text-[#0879aa]">{String(index+1).padStart(2,"0")}</span><h3 className="mt-5 font-display text-2xl font-bold leading-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{body}</p></article>)}
        </div>
        <div className="mt-12 rounded-[24px] bg-[#eef5f8] px-7 py-8 text-sm leading-7 text-slate-700 sm:px-10">Already part of the Shanah City family? Download the app and sign in with your church account. New here? You can explore visitor features and create an account to join the community.</div>
      </div>
    </section>
  </main>;
}
