import type { Metadata } from "next";
import Link from "next/link";
import { brandLogos, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shanah City Church | Welcome Home",
  description: "Visit Shanah City Church in Aurora, Colorado. Experience worship, God's Word, community, and a place to belong. Sundays at 10 AM.",
  alternates: { canonical: "https://shanahcity.org" },
  openGraph: {
    title: "Shanah City Church | Welcome Home",
    description: "Changing Lives to Higher Levels in God. Join us in Aurora, Colorado.",
    url: "https://shanahcity.org",
    siteName: "Shanah City Church",
    images: [{ url: "/home/home-gallery-01.jpg", width: 1200, height: 630 }],
  },
};

const links = [
  { label: "About", href: "#about" },
  { label: "What to expect", href: "#visit" },
  { label: "Ministries", href: "#ministries" },
  { label: "Messages", href: "#messages" },
];

const ministries = [
  { number: "01", title: "Shanah Worship", caption: "A community of worshippers making room for God's presence.", href: "/worship" },
  { number: "02", title: "Shanah Kids & Teens", caption: "A welcoming place for the next generation to grow in faith.", href: "/kids-ministry" },
  { number: "03", title: "Men & Women", caption: "Meaningful relationships, discipleship, and spiritual growth.", href: "/groups" },
  { number: "04", title: "Young Adults", caption: "Building authentic friendships and a faith that lasts.", href: "/groups" },
];

export default function ChurchSitePage() {
  return (
    <div className="min-h-screen bg-[#f8f8f5] font-sans text-[#14233a] antialiased">
      <div className="bg-[#072d50] px-4 py-2.5 text-center text-[11px] font-bold tracking-[0.08em] text-white sm:text-xs">
        A PLACE TO BELONG IN AURORA, COLORADO <span className="mx-2 text-[#f8c779]">•</span> SUNDAYS AT 10:00 AM
      </div>
      <header className="relative z-20 border-b border-[#122e4b]/10 bg-white/95">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Shanah City home" className="flex shrink-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogos.default} alt="Shanah City" className="h-11 w-auto max-w-[155px] object-contain" />
            <span className="hidden border-l border-slate-200 pl-3 text-[11px] font-extrabold uppercase leading-4 tracking-[0.12em] text-slate-500 sm:block">Church<br/>Aurora, CO</span>
          </Link>
          <nav aria-label="Public website navigation" className="hidden items-center gap-7 lg:flex">
            {links.map(link => <a key={link.href} href={link.href} className="text-[13px] font-semibold text-[#20354c] transition-colors hover:text-[#0076ba]">{link.label}</a>)}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/give" className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-[#08355c] hover:bg-blue-50 sm:inline-flex">Give</Link>
            <a href="#visit" className="rounded-full bg-[#08669d] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#064b77] sm:px-6 sm:text-sm">Plan Your Visit <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto border-t border-slate-100 px-5 pb-3 pt-2 text-xs font-bold text-[#354d64] lg:hidden">
          {links.map(link => <a key={link.href} href={link.href} className="shrink-0 py-1">{link.label}</a>)}
          <Link href="/give" className="shrink-0 py-1 sm:hidden">Give</Link>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[610px] overflow-hidden bg-[#103456] text-white lg:min-h-[690px]">
          <div className="absolute inset-0 bg-[url('/home/home-gallery-01.jpg')] bg-cover bg-center" role="img" aria-label="Shanah City church community" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#051c32]/95 via-[#07233a]/80 to-[#092d46]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#051a2b]/60 via-transparent to-transparent" />
          <div className="relative mx-auto flex min-h-[610px] max-w-[1320px] items-center px-6 py-20 sm:px-10 lg:min-h-[690px] lg:px-16">
            <div className="max-w-[760px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ffe3ad] backdrop-blur-sm"><span className="h-2 w-2 rounded-full bg-[#f9ca75]" /> Welcome to Shanah City Church</span>
              <h1 className="mt-7 font-display text-[clamp(3.5rem,8vw,7.4rem)] font-bold leading-[0.96] tracking-[-0.055em]">There's room<br/>for <span className="italic text-[#f8d49a]">you</span> here.</h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-white/90 sm:text-lg">Encounter God. Find your people. Discover the life you were created for. We would love to welcome you this Sunday.</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#visit" className="inline-flex items-center justify-center rounded-full bg-[#f9d49a] px-7 py-4 text-sm font-extrabold text-[#082a43] transition hover:bg-white">Plan Your First Visit <span className="ml-3" aria-hidden="true">↗</span></a>
                <Link href="/live" className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">Watch a Service <span className="ml-3" aria-hidden="true">▶</span></Link>
              </div>
              <div className="mt-11 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/25 pt-5 text-xs font-semibold tracking-wide text-white/80">
                <span>Sunday Worship · 10:00 AM</span>
                <span>380 S Potomac St · Aurora, CO</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-20 bg-white px-6 py-20 sm:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1210px] items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#0074aa]">More than a Sunday service</p>
              <h2 className="mt-5 font-display text-[clamp(2.6rem,5vw,4.9rem)] font-semibold leading-[1.08] tracking-[-0.045em]">A church where<br/><span className="italic text-[#1377a6]">lives change.</span></h2>
              <div className="my-7 h-[3px] w-16 rounded-full bg-[#e4ad58]" />
              <p className="max-w-xl text-[16px] leading-8 text-slate-600">Shanah City is a diverse, family-oriented, non-denominational charismatic church in Colorado. We are a community where people can meet Jesus, grow in God's Word, and experience life-giving relationships.</p>
              <p className="mt-5 max-w-xl text-[16px] leading-8 text-slate-600">Our vision is simple and enduring: <strong className="text-[#0b365c]">Changing lives to higher levels in God.</strong></p>
              <Link href="/about" className="mt-8 inline-flex items-center gap-2 border-b-2 border-[#0a6398] pb-2 text-sm font-extrabold text-[#0b527f]">Discover our story <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/home-gallery-02.jpg" alt="Shanah City church gathering" className="aspect-[5/4] w-full rounded-[28px] object-cover shadow-[0_24px_60px_rgba(4,30,54,.13)]" />
              <div className="absolute -bottom-7 left-4 max-w-[290px] rounded-2xl bg-[#07385d] px-6 py-5 text-white shadow-xl sm:-left-6"><span className="text-[11px] font-bold uppercase tracking-widest text-[#fad99c]">Our foundation</span><p className="mt-2 font-display text-lg font-semibold leading-snug">“Changed into His image.”</p><span className="mt-2 block text-xs text-blue-100">2 Corinthians 3:18</span></div>
            </div>
          </div>
        </section>

        <section id="visit" className="scroll-mt-16 bg-[#edf5f9] px-6 py-20 sm:px-10 lg:py-24">
          <div className="mx-auto max-w-[1210px]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.23em] text-[#0074aa]">Your first Sunday</p><h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-[-0.05em]">Come as you are.</h2></div>
              <p className="max-w-md text-base leading-7 text-slate-600">Whether you've been in church for years or this is your first time, you belong in the room.</p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-8 shadow-sm"><span className="text-3xl">✦</span><h3 className="mt-6 text-xl font-extrabold">Sunday Worship</h3><p className="mt-3 text-sm leading-7 text-slate-600">Join us Sundays at <strong>10:00 AM</strong> for worship, prayer, and a message grounded in God's Word.</p></div>
              <div className="rounded-3xl bg-white p-8 shadow-sm"><span className="text-3xl">♡</span><h3 className="mt-6 text-xl font-extrabold">A Warm Welcome</h3><p className="mt-3 text-sm leading-7 text-slate-600">Expect friendly faces, a culturally diverse congregation, and a welcoming place for families.</p></div>
              <div className="rounded-3xl bg-white p-8 shadow-sm"><span className="text-3xl">⌁</span><h3 className="mt-6 text-xl font-extrabold">Find Us in Aurora</h3><p className="mt-3 text-sm leading-7 text-slate-600">380 S Potomac Street, Unit 120<br/>Aurora, Colorado 80012.</p><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-bold text-[#076c9f] underline underline-offset-4">Get directions ↗</a></div>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-[26px] bg-[#07365a] px-7 py-7 text-white sm:px-10">
              <div><h3 className="font-display text-2xl font-semibold">We can't wait to meet you.</h3><p className="mt-1 text-sm text-blue-100">Questions about your visit? We're happy to help.</p></div>
              <a href={"mailto:" + site.email + "?subject=Planning%20a%20visit%20to%20Shanah%20City"} className="rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#07365a]">Connect with Us ↗</a>
            </div>
          </div>
        </section>

        <section id="ministries" className="scroll-mt-16 bg-white px-6 py-20 sm:px-10 lg:py-28">
          <div className="mx-auto max-w-[1210px]">
            <p className="text-xs font-extrabold uppercase tracking-[0.23em] text-[#0074aa]">Life happens together</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-[clamp(2.6rem,5vw,4.6rem)] font-semibold leading-tight tracking-[-0.045em]">Find your community.</h2><Link href="/groups" className="border-b-2 border-[#0a6398] pb-1 text-sm font-extrabold text-[#0b527f]">Explore groups ↗</Link></div>
            <div className="mt-10 grid overflow-hidden rounded-[26px] border border-slate-200 md:grid-cols-2">
              {ministries.map((item, i) => <Link key={item.number} href={item.href} className={`group flex min-h-[205px] gap-5 border-slate-200 p-7 transition hover:bg-[#f4f9fc] sm:p-9 ${i % 2 === 0 ? "md:border-r" : ""} ${i < 2 ? "border-b" : ""} ${i === 2 ? "max-md:border-b" : ""}`}>
                <span className="pt-1 text-xs font-extrabold tracking-widest text-[#0b83bd]">{item.number}</span>
                <div><h3 className="font-display text-2xl font-bold text-[#17304c]">{item.title} <span className="ml-2 inline-block text-sm text-[#0b83bd] transition group-hover:translate-x-1">↗</span></h3><p className="mt-3 max-w-xs text-sm leading-7 text-slate-600">{item.caption}</p></div>
              </Link>)}
            </div>
          </div>
        </section>

        <section id="messages" className="scroll-mt-16 bg-[#092d4b] px-6 py-20 text-white sm:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1210px] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[26px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/home-gallery-03.jpg" alt="Church worship and teaching" className="aspect-video w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#092d4b]/65 to-transparent" />
              <Link href="/sermons" className="absolute bottom-5 left-5 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#092d4b]">Watch Messages <span aria-hidden="true">▶</span></Link>
            </div>
            <div><p className="text-xs font-extrabold uppercase tracking-[0.23em] text-[#ffcf8a]">Faith for every day</p><h2 className="mt-4 font-display text-[clamp(2.6rem,5vw,4.4rem)] font-semibold leading-[1.08] tracking-[-0.04em]">A word that moves you forward.</h2><p className="mt-6 max-w-lg text-base leading-8 text-blue-100">Carry the message beyond Sunday. Explore sermons, daily devotions, and meaningful ways to grow in faith throughout the week.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/sermons" className="rounded-full bg-[#fbd69d] px-6 py-3.5 text-sm font-extrabold text-[#092d4b]">Explore Sermons ↗</Link><Link href="/devotions" className="rounded-full border border-white/50 px-6 py-3.5 text-sm font-bold text-white">Daily Devotions</Link></div></div>
          </div>
        </section>

        <section className="bg-[#fbfaf7] px-6 py-20 sm:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1210px] items-center gap-8 rounded-[28px] bg-white p-7 shadow-[0_12px_45px_rgba(5,40,72,.07)] sm:p-12 lg:grid-cols-[1fr_auto]">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.23em] text-[#0d7cac]">Make a difference</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[#142d49] sm:text-5xl">Generosity changes lives.</h2><p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">Your giving helps support the mission of Shanah City, ministry to families, and reaching our community with the love of Christ.</p></div>
            <Link href="/give" className="inline-flex justify-center rounded-full bg-[#0b6699] px-8 py-4 text-sm font-extrabold text-white hover:bg-[#084b77]">Give Online ↗</Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#061f35] px-6 pb-9 pt-16 text-white sm:px-10">
        <div className="mx-auto grid max-w-[1210px] gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div><div className="flex items-center gap-3"><span className="font-display text-3xl font-bold">Shanah City</span><span className="text-xs font-bold uppercase tracking-widest text-[#f3c47c]">Church</span></div><p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">Changing Lives to Higher Levels in God.<br/>A welcoming church community in Aurora, Colorado.</p></div>
          <div><h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f3c47c]">Explore</h3><div className="mt-5 grid gap-3 text-sm text-blue-100"><a href="#about">Who We Are</a><a href="#visit">Plan a Visit</a><Link href="/sermons">Messages</Link><Link href="/devotions">Devotions</Link><Link href="/community">Member Community</Link></div></div>
          <div><h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f3c47c]">Visit & connect</h3><div className="mt-5 space-y-3 text-sm leading-7 text-blue-100"><p>Sunday · 10:00 AM</p><p>{site.address}</p><a href={"mailto:" + site.email} className="block underline underline-offset-4">{site.email}</a><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4">Directions ↗</a></div></div>
        </div>
        <div className="mx-auto flex max-w-[1210px] flex-wrap items-center justify-between gap-4 pt-7 text-xs text-white/65"><span>© {new Date().getFullYear()} Shanah City Church. All rights reserved.</span><div className="flex gap-5"><a href={site.social.facebook[0].url} target="_blank" rel="noopener noreferrer">Facebook</a><a href={site.social.instagram[0].url} target="_blank" rel="noopener noreferrer">Instagram</a><a href={site.social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></div></div>
      </footer>
    </div>
  );
}
