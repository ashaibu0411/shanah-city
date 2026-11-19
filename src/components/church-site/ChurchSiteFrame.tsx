import { brandLogos, site } from "@/lib/site";
import type { ReactNode } from "react";

export const publicNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Visit", href: "/visit" },
  { label: "Ministries", href: "/ministries" },
  { label: "Messages", href: "/messages" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/contact" },
  { label: "Download App", href: "/app" },
];

export function ChurchSiteHeader() {
  return (
    <>
      <div className="bg-[#073356] px-4 py-2.5 text-center text-[11px] font-bold tracking-[0.1em] text-white">
        A CHURCH FOR YOU AND YOUR FAMILY <span className="mx-2 text-[#efc783]">•</span> SUNDAY AT 10:00 AM · AURORA, CO
      </div>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-10">
          <a href="/" className="flex items-center gap-3" aria-label="Shanah City Church home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogos.default} alt="Shanah City" className="h-11 w-auto max-w-[145px] object-contain" />
            <span className="hidden border-l border-slate-200 pl-3 text-[10px] font-extrabold uppercase leading-4 tracking-[0.13em] text-slate-500 sm:block">Aurora<br/>Colorado</span>
          </a>
          <nav aria-label="Church website" className="hidden items-center gap-6 xl:flex">
            {publicNav.map(item => <a key={item.href} href={item.href} className="text-[13px] font-bold text-slate-700 transition hover:text-[#0574ae]">{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="/give" className="hidden rounded-full px-4 py-3 text-sm font-bold text-[#08466f] hover:bg-blue-50 md:block">Give</a>
            <a href="/visit" className="rounded-full bg-[#0b689c] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#08507c] sm:px-6 sm:text-sm">Plan a Visit ↗</a>
            <details className="group relative xl:hidden">
              <summary aria-label="Open navigation" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">☰</summary>
              <nav aria-label="Mobile church website" className="absolute right-0 top-14 z-50 w-[min(86vw,320px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                {publicNav.map(item => <a key={item.href} href={item.href} className="block rounded-lg px-4 py-3 text-sm font-bold text-slate-800 hover:bg-sky-50">{item.label}</a>)}
                <a href="/give" className="block rounded-lg bg-[#e9f4fb] px-4 py-3 text-sm font-bold text-[#064b76]">Give Online</a>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}

export function ChurchSiteFooter() {
  return (
    <footer className="bg-[#061f35] px-6 pb-9 pt-16 text-white sm:px-10">
      <div className="mx-auto grid max-w-[1210px] gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div><p className="font-display text-3xl font-bold">Shanah City <span className="text-base text-[#f3c47c]">CHURCH</span></p><p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">Changing Lives to Higher Levels in God.<br/>A welcoming, multicultural church family in Aurora, Colorado.</p><a href="/visit" className="mt-5 inline-flex rounded-full bg-[#eec98c] px-5 py-3 text-sm font-extrabold text-[#072d4b]">Join Us This Sunday ↗</a></div>
        <div><h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f3c47c]">Explore</h3><div className="mt-5 grid grid-cols-2 gap-3 text-sm text-blue-100">{publicNav.map(item=><a key={item.href} href={item.href} className="hover:text-white">{item.label}</a>)}<a href="/give">Give</a><a href="/app">Download Our App</a><a href="https://shanah-city.vercel.app">Member Sign In</a></div></div>
        <div><h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f3c47c]">Visit & connect</h3><div className="mt-5 space-y-3 text-sm leading-7 text-blue-100"><p>Sunday Worship · 10:00 AM</p><p>{site.address}</p><a href={`mailto:${site.email}`} className="block underline underline-offset-4">{site.email}</a><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4">Get Directions ↗</a></div></div>
      </div>
      <div className="mx-auto flex max-w-[1210px] flex-wrap items-center justify-between gap-4 pt-7 text-xs text-white/65"><span>© {new Date().getFullYear()} Shanah City Church. All rights reserved.</span><div className="flex gap-5"><a href={site.social.facebook[0].url} target="_blank" rel="noopener noreferrer">Facebook</a><a href={site.social.instagram[0].url} target="_blank" rel="noopener noreferrer">Instagram</a><a href={site.social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></div></div>
    </footer>
  );
}

export function ChurchSiteFrame({children}:{children:ReactNode}) {
  return <div className="min-h-screen bg-[#f8f8f5] font-sans text-[#14233a] antialiased"><ChurchSiteHeader/>{children}<ChurchSiteFooter/></div>;
}

export function ChurchPageIntro({eyebrow,title,description,image,imagePosition = "center"}:{eyebrow:string;title:string;description:string;image:string;imagePosition?:string}) {
  return <section className="relative isolate overflow-hidden bg-[#072d4c] px-6 py-24 text-white sm:px-10 lg:py-32">
    <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url('${image}')`,backgroundPosition:imagePosition}} aria-hidden="true"/>
    <div className="absolute inset-0 bg-gradient-to-r from-[#041a2f]/95 via-[#06243e]/90 to-[#06243e]/45"/>
    <div className="relative mx-auto max-w-[1210px]"><p className="text-xs font-extrabold uppercase tracking-[0.23em] text-[#f7ce90]">{eyebrow}</p><h1 className="mt-5 max-w-4xl font-display text-[clamp(3.2rem,7vw,6rem)] font-semibold leading-[1.04] tracking-[-0.055em]">{title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">{description}</p></div>
  </section>;
}

export function ChurchSectionHeading({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}) {
  return <div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#0b77ab]">{eyebrow}</p><h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.13] tracking-[-0.045em]">{title}</h2>{description?<p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{description}</p>:null}</div>;
}
