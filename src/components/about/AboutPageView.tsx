import Link from "next/link";
import { leadership, site } from "@/lib/site";

const values = [
  { name: "Jesus at the center", statement: "At the center of everything is Jesus.", detail: "We exalt Christ in our worship, preaching, decisions, and daily lives." },
  { name: "Life in the Holy Spirit", statement: "We believe in speaking, praying, and the interpretation of tongues.", detail: "We welcome the gifts of the Spirit and seek to exercise them with biblical order, discernment, and love." },
  { name: "Unselfish love", statement: "We glorify God by unselfishly loving each other.", detail: "People matter to God, so they matter to us. We serve with compassion and treat one another with dignity." },
  { name: "Excellence", statement: "We autograph our work with excellence.", detail: "We steward our gifts, time, and responsibilities faithfully as worship to God." },
  { name: "World changers", statement: "We are world changers.", detail: "We raise disciples whose faith makes a meaningful difference in their homes, workplaces, communities, and nations." },
  { name: "Barrier breakers", statement: "We are barrier breakers.", detail: "In Christ, we pursue courage, reconciliation, and hope beyond limits, backgrounds, and circumstances." },
  { name: "Multiplication", statement: "We multiply the bread.", detail: "Like Jesus feeding the multitude, we bring what we have to God and share generously so more lives are blessed." },
  { name: "Teachability and honor", statement: "We love knowledge, instruction, and respect.", detail: "We grow through Scripture, wise counsel, correction, humility, and mutual honor." },
  { name: "Unity", statement: "We live together in unity.", detail: "We are one spiritual family, strengthened by different gifts, cultures, generations, and experiences." },
  { name: "Gratitude", statement: "We appreciate our own and believe gratitude is the best attitude.", detail: "We celebrate people, acknowledge God's goodness, and make thanksgiving part of our culture." },
];

const beliefs = [
  { title: "The One True God", reference: "Deuteronomy 6:4; Matthew 28:19", description: "We believe in one eternal God, revealed as Father, Son, and Holy Spirit, worthy of all worship, trust, and obedience." },
  { title: "The Deity of Jesus", reference: "John 1:1–14; Colossians 2:9", description: "Jesus Christ is fully God and fully man. Through His sinless life, sacrificial death, and bodily resurrection, He reveals the Father and reconciles us to God." },
  { title: "The Salvation of Man", reference: "Ephesians 2:8–9; Romans 10:9–10", description: "Salvation is God's gift of grace received through repentance and faith in Jesus Christ, not something we earn through our works." },
  { title: "The Baptism of the Holy Spirit", reference: "Acts 1:8; Acts 2:1–4", description: "We believe the Holy Spirit empowers believers for holy living, bold witness, prayer, and service, and that His gifts remain relevant to the church today." },
  { title: "Speaking, Praying, and Interpretation of Tongues", reference: "1 Corinthians 12:7–11; 1 Corinthians 14:13, 26–33", description: "We believe in the biblical gifts of tongues and interpretation. In gathered worship, spiritual gifts should operate with love, discernment, and order to strengthen the church." },
  { title: "Laying of Hands and the Slaying in the Holy Spirit", reference: "Acts 8:17; Acts 19:6; John 18:6", description: "We believe in prayer and the laying on of hands as biblical expressions of ministry, blessing, and impartation. We also recognize that people may respond physically to encounters with the Holy Spirit, sometimes described as being overcome or falling under His power. Such experiences are not the measure of someone's salvation or spiritual maturity." },
  { title: "Communion", reference: "Luke 22:19–20; 1 Corinthians 11:23–26", description: "We observe the Lord's Supper in remembrance of Jesus Christ, proclaiming His death and celebrating the new covenant secured by His blood." },
  { title: "Sanctification", reference: "1 Thessalonians 4:3; 2 Corinthians 3:18", description: "Through the Word and the Holy Spirit, God continually transforms believers in character, holiness, love, and likeness to Jesus Christ." },
];

const initiatives = [
  { title: "Children and youth", detail: "A long-term desire to support the next generation through discipleship, safe learning environments, and family-centered programs." },
  { title: "After-school support", detail: "Exploring opportunities for tutoring, mentoring, and enrichment in partnership with families and the wider community." },
  { title: "Family and housing support", detail: "Seeking appropriate partnerships and practical pathways to assist individuals and families facing difficult circumstances." },
  { title: "Vocational development", detail: "Envisioning skills training, mentoring, and opportunities that help people grow in confidence, stability, and purpose." },
];

const anchorClass = "inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-white/20 sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm";
const sectionClass = "min-w-0 scroll-mt-20 rounded-2xl border border-slate-200 bg-white px-4 py-6 shadow-[0_10px_32px_rgba(15,23,42,0.04)] min-[380px]:px-5 sm:scroll-mt-24 sm:rounded-[1.65rem] sm:p-9 lg:p-12";

export function AboutPageView() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl space-y-4 px-3 pb-20 pt-3 min-[380px]:px-4 sm:space-y-7 text-slate-900 sm:px-6 sm:pt-8">
      <header className="relative overflow-hidden rounded-2xl bg-[#061b3b] px-5 py-8 min-[380px]:px-6 sm:rounded-[1.85rem] text-white shadow-xl sm:px-12 sm:py-16 lg:px-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.23em] text-amber-300">Welcome to Shanah City</p>
          <h1 className="mt-3 break-words font-display text-[clamp(1.85rem,7.4vw,2.4rem)] font-extrabold leading-[1.14] tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">Our Story. Our Faith. Our Purpose.</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-blue-100 sm:mt-5 sm:text-xl">{site.tagline}</p>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/85 sm:text-base sm:leading-8">A Christ-centered, Spirit-empowered church family being transformed by His glory and called to make His love visible in our communities and beyond.</p>
          <nav aria-label="Explore About Shanah City" className="-mx-1 mt-6 flex snap-x gap-2 overflow-x-auto px-1 pb-2 sm:mt-8 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <a className={anchorClass} href="#our-story">Our story</a>
            <a className={anchorClass} href="#mission-vision">Mission & vision</a>
            <a className={anchorClass} href="#core-values">Core values</a>
            <a className={anchorClass} href="#beliefs">What we believe</a>
          </nav>
        </div>
      </header>

      <section id="our-story" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">Established October 1, 2017 · Denver, Colorado</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 leading-tight sm:text-4xl">A calling that became a city</h2>
        <div className="mt-4 grid min-w-0 gap-5 text-[15px] leading-7 text-slate-700 sm:mt-6 sm:gap-7 sm:text-base sm:leading-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4 sm:space-y-5">
            <p>Shanah City began on October 1, 2017, in Denver, Colorado, through what its founders, <strong>Apostle Zaq Nombre and Lady Nayram Nombre</strong>, believe was a divine call to establish a Christ-centered ministry. The church was originally known as <strong>Shanah International Center</strong>.</p>
            <p>During a worship service, the ministry received a defining prophetic word: <strong>“Out of you shall come a city.”</strong> That word enlarged the vision beyond a gathering or a building. It spoke of people being raised, families being strengthened, disciples being equipped, and a spiritual community whose influence would extend beyond its walls. In response, the ministry became known as <strong>Shanah City</strong>.</p>
            <p>What began as an act of faith continues as a commitment to introduce people to Jesus Christ, help believers mature in Him, cultivate authentic fellowship, and serve our neighbors with compassion. Shanah City is a diverse, family-oriented, non-denominational charismatic church rooted in the Word of God and dependent on the Holy Spirit.</p>
          </div>
          <aside className="min-w-0 self-start rounded-xl bg-[#eef4ff] p-4 sm:rounded-2xl sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-800">The word Shanah</p>
            <p className="mt-3 font-display text-4xl font-bold text-[#0c2855]" lang="he" dir="rtl">שָׁנָה</p>
            <p className="mt-3 text-base leading-7 text-slate-700"><strong>Shanah</strong> is a Hebrew word meaning <strong>“year.”</strong> For our church, it also speaks to the journey through God's appointed seasons—times to grow, be renewed, bear fruit, and become more like Christ.</p>
            <p className="mt-4 border-t border-blue-200 pt-4 text-sm font-semibold leading-6 text-blue-900">“We all … are being transformed into the same image from glory to glory.” — 2 Corinthians 3:18</p>
          </aside>
        </div>
      </section>

      <section id="mission-vision" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">What guides us</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl">Our mission & vision</h2>
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[#082a59] p-5 sm:rounded-2xl text-white sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-amber-300">Our mission</h3>
            <p className="mt-3 text-xl font-extrabold leading-snug sm:mt-4 sm:text-2xl">Changing lives to higher levels in God.</p>
            <p className="mt-4 text-base leading-7 text-blue-100">We lead people into a growing relationship with Jesus Christ through biblical teaching, Spirit-led worship, prayer, discipleship, and authentic Christian community.</p>
          </div>
          <div className="rounded-xl bg-[#f2f6fc] p-5 sm:rounded-2xl sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-blue-800">Our vision</h3>
            <p className="mt-3 text-xl font-extrabold leading-snug sm:mt-4 sm:text-2xl text-slate-950">A transformed people who transform their world.</p>
            <p className="mt-4 text-base leading-7 text-slate-700">We envision a thriving spiritual family that reveals the glory of Christ, equips disciples to live out their God-given purpose, strengthens families, and raises people who bring hope and positive influence to their communities and the nations.</p>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-slate-700 sm:mt-6 sm:text-base sm:leading-8">Our calling is both <strong>spiritual and practical</strong>: to proclaim the gospel faithfully, develop mature followers of Jesus, and express His love through genuine relationships, compassionate service, and responsible stewardship.</p>
      </section>

      <section id="community" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">Faith beyond Sunday</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl">A church for the community</h2>
        <p className="mt-4 max-w-4xl text-[15px] leading-7 text-slate-700 sm:mt-5 sm:text-base sm:leading-8">We believe the church is called not only to gather in worship but also to be present where people live, learn, work, and raise their families. We want children to flourish, parents to find support, young adults to discover purpose, and neighbors to experience the love of Christ in ways they can recognize and receive.</p>
        <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-700 sm:mt-4 sm:text-base sm:leading-8">As we grow, Shanah City is <strong>exploring and developing</strong> community-focused initiatives, including the opportunities below. These describe our direction and aspirations; they are <strong>not claims that every program is currently operating</strong>. We intend to build responsibly through capable leaders, appropriate safeguards, community listening, and trusted partnerships.</p>
        <div className="mt-5 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4">
          {initiatives.map((item) => (
            <article key={item.title} className="rounded-xl border border-blue-100 bg-blue-50/65 p-4 sm:rounded-2xl sm:p-6">
              <h3 className="text-lg font-extrabold text-[#0c2855]">{item.title}</h3>
              <p className="mt-2 text-base leading-7 text-slate-700">{item.detail}</p>
            </article>
          ))}
        </div>
        <p className="mt-5 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-4 text-[15px] sm:mt-6 sm:px-5 sm:text-base leading-7 text-slate-800">Our hope is that every person we serve will be encouraged to discover their God-given worth, grow in stability and purpose, and contribute meaningfully to the community around them.</p>
      </section>

      <section id="core-values" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">The culture we cultivate</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl">Our creed & core values</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:mt-4 sm:text-base sm:leading-8">These ten convictions shape how we worship, lead, serve, relate to one another, and represent Christ wherever we go.</p>
        <div className="mt-5 grid gap-3 sm:mt-7 md:grid-cols-2">
          {values.map((value, index) => (
            <article key={value.name} className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl bg-[#082a59] text-sm font-extrabold text-white">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold leading-snug text-slate-950 sm:text-lg">{value.name}</h3>
                <p className="mt-1.5 text-[15px] font-semibold leading-6 text-[#0c2855] sm:mt-2 sm:text-base sm:leading-7">{value.statement}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-700 sm:mt-2">{value.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="beliefs" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">Rooted in the Word</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl">Our foundational beliefs</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:mt-4 sm:text-base sm:leading-8">We are a Bible-believing, Christ-centered, Spirit-empowered church. These eight foundations summarize central truths we teach and practice. Open any topic to explore the explanation and Scripture references.</p>
        <div className="mt-5 space-y-2.5 sm:mt-7 sm:space-y-3">
          {beliefs.map((belief, index) => (
            <details key={belief.title} className="group min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl open:border-blue-200 open:bg-blue-50/45 sm:p-6">
              <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-2 text-[15px] sm:items-center sm:gap-4 sm:text-base font-extrabold leading-snug text-slate-950 marker:hidden">
                <span className="min-w-0 flex-1"><span className="mr-2 text-xs text-blue-700 sm:mr-3 sm:text-sm">{String(index + 1).padStart(2, "0")}</span>{belief.title}</span>
                <span aria-hidden className="shrink-0 text-xl font-normal text-blue-800 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:mt-4 sm:text-base sm:leading-8">{belief.description}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-blue-800">Explore in Scripture: {belief.reference}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="leadership" className={sectionClass}>
        <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-blue-700">Servant leadership</p>
        <h2 className="mt-2 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl">People called to serve</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:mt-4 sm:text-base sm:leading-8">Apostle Zaq Nombre and Lady Nayram Nombre founded Shanah City in faith and continue to encourage a culture of Christ-centered leadership, discipleship, and compassionate service. Ministry leaders and volunteers help carry this calling into every area of church life.</p>
        <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {leadership.map((leader) => (
            <div key={leader.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:p-4">
              <p className="text-base font-bold text-slate-950">{leader.name}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{leader.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-[#092348] px-5 py-7 sm:rounded-[1.65rem] text-white sm:p-10">
        <h2 className="font-display text-[1.55rem] font-extrabold leading-tight sm:text-3xl">There is a place for you here.</h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-blue-100 sm:text-base sm:leading-8">Whether you are exploring faith, looking for a church family, or seeking opportunities to serve your community, we would love to connect with you.</p>
        <div className="mt-5 flex flex-col gap-2.5 min-[440px]:flex-row min-[440px]:flex-wrap sm:mt-6 sm:gap-3">
          <Link href="/connect" className="inline-flex min-h-11 w-full items-center justify-center rounded-full min-[440px]:w-auto sm:min-h-12 bg-amber-400 px-6 py-3 text-sm font-bold text-[#081d3b] hover:bg-amber-300">Plan a visit</Link>
          <Link href="/groups" className="inline-flex min-h-11 w-full items-center justify-center rounded-full min-[440px]:w-auto sm:min-h-12 border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Explore ministries</Link>
          <Link href="/community" className="inline-flex min-h-11 w-full items-center justify-center rounded-full min-[440px]:w-auto sm:min-h-12 border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Connect with our community</Link>
        </div>
      </section>
    </main>
  );
}
