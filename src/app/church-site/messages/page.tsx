import type { Metadata } from "next";
import { ChurchPageIntro, ChurchSectionHeading } from "@/components/church-site/ChurchSiteFrame";
import { getChannelSermons } from "@/lib/youtube-sermons-server";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Messages & Sermons | Shanah City Church",description:"Watch recent messages and worship services from Shanah City Church.",alternates:{canonical:"https://shanahcity.org/messages"}};
export default async function MessagesWebsite(){
  const sermons = (await getChannelSermons(6)).slice(0,6);
  return <main><ChurchPageIntro eyebrow="Faith for the journey" title="Messages that build faith." description="Explore biblical teaching and inspiring messages from our church family. Carry the Word with you through the week." image="/home/home-gallery-12.jpg"/>
  <section className="mx-auto max-w-[1210px] px-6 py-20"><ChurchSectionHeading eyebrow="Watch & grow" title="Recent sermons." description="Watch on Shanah City's YouTube channel, or explore the full sermons library in the member app."/>
  <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {sermons.length ? sermons.map((video,index)=> {
    const url = video.watchUrl || site.social.youtube;
    return <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-[#0e3553]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={video.thumbnailUrl || "/home/home-gallery-12.jpg"} alt="" className="aspect-video w-full object-cover"/><span className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#0d3655]">▶ Watch Message</span></div>
      <div className="p-6"><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#08729f]">Shanah City Sermon</p><h3 className="mt-3 font-display text-xl font-bold leading-snug group-hover:text-[#0a6b9b]">{video.title}</h3></div>
    </a>;
  }):<div className="rounded-2xl bg-[#eaf2f7] p-9 text-slate-700 md:col-span-3">Our message library is available on YouTube. <a className="font-extrabold text-[#0878a5] underline" href={site.social.youtube} target="_blank" rel="noopener noreferrer">Watch Shanah City ↗</a></div>}
  </div><div className="mt-10 flex flex-wrap gap-4"><a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#09679b] px-7 py-3.5 text-sm font-extrabold text-white">More on YouTube ↗</a><a href="/devotions" className="rounded-full border border-[#0b6a9b] px-7 py-3.5 text-sm font-extrabold text-[#075c88]">Read Devotions ↗</a></div></section></main>;
}