import type { Metadata } from "next";
import { GuestCaptureForm } from "@/components/guest/GuestCaptureForm";
import { ChurchPageIntro, ChurchSectionHeading } from "@/components/church-site/ChurchSiteFrame";
import { site } from "@/lib/site";

export const metadata: Metadata = {title:"Plan Your Visit | Shanah City Church",description:"Plan your first Sunday at Shanah City in Aurora. Service times, location, children's ministry, worship, and welcome information.",alternates:{canonical:"https://shanahcity.org/visit"}};

export default function VisitPage(){
  return <main><ChurchPageIntro eyebrow="Your first Sunday" title="Come as you are. Leave encouraged." description="New to Shanah City? From the moment you arrive, our church family would love to make you feel at home." image="/home/home-gallery-15.jpg" imagePosition="center 12%"/>
    <section className="mx-auto grid max-w-[1210px] gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
      <div><ChurchSectionHeading eyebrow="What to expect" title="A Sunday made for everyone." description="Join a diverse church family for heartfelt worship, prayer, biblical teaching, and opportunities to connect."/>
        <div className="mt-9 grid gap-5">
          {[["Worship & the Word",site.visitInfo.worship],["Families are welcome","Shanah Kids and Teens support families and the next generation. Ask our welcome team where to go when you arrive."],["Come comfortably","You do not need to know anyone or have everything figured out. Our team can help you find your way."]].map(([title,body])=><div key={title} className="border-l-4 border-[#d6a65c] pl-5"><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{body}</p></div>)}
        </div>
      </div>
      <div className="rounded-[28px] bg-[#edf6f9] p-7 sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#0b6f9c]">Service & location</p>
        <h2 className="mt-4 font-display text-4xl font-bold">We saved you a seat.</h2>
        {site.serviceTimes.map(s=><div key={s.day} className="mt-6 border-b border-[#c8dce7] pb-5"><p className="font-extrabold">{s.day === "Friday Evenings" ? "Glory Encounter Service" : s.day}</p><p className="mt-1 text-lg text-[#0d668f]">{s.time}</p></div>)}
        <p className="mt-6 font-bold">{site.address}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{site.visitInfo.duration}</p>
        <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex rounded-full bg-[#075f91] px-6 py-3.5 text-sm font-extrabold text-white">Get Directions ↗</a>
      </div>
    </section>
    <section className="bg-white px-6 py-20 sm:px-10"><div className="mx-auto grid max-w-[1210px] gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><ChurchSectionHeading eyebrow="Let us know you're coming" title="We're excited to meet you." description="If you're planning your first visit, share your details with our welcome team. No church account is required."/></div><div className="rounded-[26px] border border-slate-200 bg-[#fbfcfd] p-5 sm:p-8"><GuestCaptureForm embedded standalone /></div></div></section>
    <section className="bg-[#082d4c] px-6 py-14 text-center text-white"><h2 className="font-display text-3xl">Questions before Sunday?</h2><p className="mt-3 text-blue-100">Our team is ready to help.</p><a href="/contact" className="mt-6 inline-flex rounded-full bg-[#efd1a1] px-6 py-3 font-extrabold text-[#072843]">Contact Us ↗</a></section>
  </main>;
}