import type { Metadata } from "next";
import { ChurchPageIntro, ChurchSectionHeading } from "@/components/church-site/ChurchSiteFrame";
import { getEvents } from "@/lib/event-server";
import { pickUpcomingHomeEventRows, formatHomeEventMeta } from "@/lib/home-upcoming-events";
import { site } from "@/lib/site";
import { WeeklyAnnouncements } from "@/components/calendar/WeeklyAnnouncements";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Events | Shanah City Church",description:"Upcoming services, gatherings and events at Shanah City Church in Aurora, Colorado.",alternates:{canonical:"https://shanahcity.org/events"}};
export default async function EventsWebsite(){
 const rows = pickUpcomingHomeEventRows(await getEvents({groupId:null}),12);
 return <main><ChurchPageIntro eyebrow="Gather with us" title="Life happens together." description="Worship, grow and build lasting connections through upcoming church gatherings and special events." image="/home/home-gallery-26.jpg"/>
 <section className="mx-auto max-w-[1210px] px-6 pt-16"><WeeklyAnnouncements website /></section>
 <section className="mx-auto max-w-[1210px] px-6 py-20"><ChurchSectionHeading eyebrow="What's coming up" title="Upcoming events." description="These are published events from the Shanah City calendar and update as our schedule changes."/>
 <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rows.length ? rows.map(({event,occurrenceDate})=><article key={event.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm"><div className="h-48 bg-[#0c3255]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={event.artworkWideUrl || event.artworkBannerUrl || event.artworkSquareUrl || "/home/home-gallery-15.jpg"} alt="" className="h-full w-full object-cover"/></div><div className="p-7"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0a729f]">{formatHomeEventMeta(event,occurrenceDate).meta}</p><h3 className="mt-3 font-display text-2xl font-bold">{event.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{event.location}</p><a href="/calendar" className="mt-5 inline-flex border-b-2 border-[#086e9f] pb-1 text-sm font-extrabold text-[#086e9f]">Event Details & RSVP ↗</a></div></article>):<div className="rounded-3xl bg-[#eaf3f8] p-9 md:col-span-3"><p className="font-semibold">No additional special events are currently listed.</p><p className="mt-2 text-slate-600">You're always welcome at our regular services.</p></div>}</div>
 <div className="mt-14 rounded-[26px] bg-[#092f50] px-8 py-10 text-white sm:px-12"><h2 className="font-display text-3xl font-bold">Worship with us this week.</h2>{site.serviceTimes.map(s=><p key={s.day} className="mt-4 text-blue-100">{s.day} · {s.time}</p>)}<a href="/visit" className="mt-7 inline-flex rounded-full bg-[#f1ce91] px-6 py-3.5 text-sm font-extrabold text-[#082d4c]">Plan Your Visit ↗</a></div></section></main>;
}