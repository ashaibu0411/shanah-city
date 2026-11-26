import { brandLogos, site } from "@/lib/site";
import {
  formatHomeEventMeta,
  type HomeUpcomingEventRow,
} from "@/lib/home-upcoming-events";
import { homeSermonInlineThumbnail } from "@/lib/home-sermon-display";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";

const ministries = [
  {
    title: "Shanah Worship",
    caption: "A community of worshippers making room for God's presence.",
    href: "/worship",
    image: "/home/home-gallery-88.jpg",
  },
  {
    title: "Kids & Teens",
    caption: "A welcoming place for the next generation to grow in faith.",
    href: "/kids-ministry",
    image: "/home/home-gallery-21.jpg",
  },
  {
    title: "Men & Women",
    caption: "Discipleship, accountability, and life-giving relationships.",
    href: "/groups",
    image: "/home/home-gallery-15.jpg",
  },
  {
    title: "Young Adults",
    caption: "Authentic friendships and a faith that lasts beyond Sunday.",
    href: "/groups",
    image: "/home/home-gallery-20.jpg",
  },
];

type ChurchSiteHomeProps = {
  upcomingEvents: HomeUpcomingEventRow[];
  latestSermon: SermonVideo | null;
};

export function ChurchSiteHome({ upcomingEvents, latestSermon }: ChurchSiteHomeProps) {
  const sermonThumb = homeSermonInlineThumbnail(
    latestSermon?.thumbnailUrl ?? "/home/home-gallery-12.jpg",
  );
  const sermonTitle = latestSermon?.title ?? "Watch our latest message";
  const sermonDate = latestSermon?.publishedAt
    ? formatSermonDate(latestSermon.publishedAt)
    : null;

  return (
    <main className="church-premium">
      <section className="relative isolate min-h-[min(92vh,44rem)] overflow-hidden bg-[var(--church-navy-deep)] text-white">
        <div
          className="absolute inset-0 bg-cover bg-[center_32%]"
          style={{ backgroundImage: "url('/home/home-gallery-36.jpg')" }}
          role="img"
          aria-label="Shanah City Church gathering"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#061329]/92 via-[#10264a]/72 to-[#10264a]/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#061329]/55 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[min(92vh,44rem)] max-w-6xl flex-col justify-end px-6 pb-16 pt-28 sm:px-10 lg:px-14 lg:pb-20">
          <p className="church-premium__eyebrow text-[var(--church-gold-soft)]">
            Shanah City Church · Aurora, Colorado
          </p>
          <h1 className="church-premium__title mt-4 max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)] text-white">
            There is room for you here.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/88 sm:text-lg">
            Encounter God, find your people, and discover the life you were created for.
            We would love to welcome you this Sunday at 10:00 AM.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="/visit" className="church-premium__btn-primary">
              Plan your first visit
            </a>
            <a href="/messages" className="church-premium__btn-ghost">
              Watch a service
            </a>
          </div>
          <p className="mt-10 border-t border-white/20 pt-5 text-sm text-white/75">
            {site.address} · Sunday worship 10:00 AM
          </p>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 px-6 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <p className="church-premium__eyebrow">More than a Sunday service</p>
            <h2 className="church-premium__title mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)]">
              A church where lives change.
            </h2>
            <div className="church-premium__rule" />
            <p className="mt-6 max-w-lg text-base leading-8 text-[var(--church-ink-muted)]">
              Shanah City is a diverse, family-oriented church in Colorado — a community
              where people meet Jesus, grow in God&apos;s Word, and experience life-giving
              relationships.
            </p>
            <p className="mt-4 max-w-lg text-base leading-8 text-[var(--church-ink-muted)]">
              <strong className="font-semibold text-[var(--church-navy)]">
                Changing lives to higher levels in God.
              </strong>
            </p>
            <a href="/about" className="church-premium__link mt-8 inline-block">
              Discover our story
            </a>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/home-gallery-08.jpg"
              alt="Shanah City church family"
              className="aspect-[5/4] w-full rounded-2xl object-cover shadow-[0_20px_50px_rgba(16,38,74,0.12)]"
            />
            <div className="absolute -bottom-6 left-4 max-w-[17rem] rounded-xl border border-[var(--church-gold-soft)]/40 bg-[var(--church-navy)] px-5 py-4 text-white shadow-lg sm:-left-5">
              <p className="text-xs font-semibold tracking-wide text-[var(--church-gold)]">
                Our foundation
              </p>
              <p className="mt-1 font-display text-lg font-semibold leading-snug">
                Changed into His image.
              </p>
              <p className="mt-1 text-xs text-white/70">2 Corinthians 3:18</p>
            </div>
          </div>
        </div>
      </section>

      <section id="visit" className="scroll-mt-20 border-y border-sand-200 bg-sand-50 px-6 py-20 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="church-premium__eyebrow">Your first Sunday</p>
            <h2 className="church-premium__title mt-3 text-[clamp(2rem,4vw,3.25rem)]">
              Come as you are.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Sunday worship",
                body: "Join us at 10:00 AM for worship, prayer, and teaching grounded in Scripture.",
              },
              {
                title: "A warm welcome",
                body: "Friendly faces, a multicultural congregation, and space for whole families.",
              },
              {
                title: "Find us in Aurora",
                body: site.address,
                link: { href: site.mapsUrl, label: "Get directions" },
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-sand-200 bg-white p-8 shadow-sm"
              >
                <h3 className="font-display text-xl font-semibold text-[var(--church-navy)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--church-ink-muted)]">{card.body}</p>
                {card.link ? (
                  <a
                    href={card.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="church-premium__link mt-4 inline-block text-sm"
                  >
                    {card.link.label}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ministries" className="scroll-mt-20 px-6 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="church-premium__eyebrow">Life happens together</p>
              <h2 className="church-premium__title mt-3 text-[clamp(2rem,4vw,3.25rem)]">
                Find your community.
              </h2>
            </div>
            <a href="/ministries" className="church-premium__link">
              Explore ministries
            </a>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {ministries.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group grid grid-cols-[7.5rem_1fr] gap-4 overflow-hidden rounded-2xl border border-sand-200 bg-white transition hover:border-[var(--church-gold-soft)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  className="h-full min-h-[8.5rem] w-full object-cover"
                />
                <div className="py-5 pr-5">
                  <h3 className="font-display text-lg font-semibold text-[var(--church-navy)] group-hover:text-clay-600">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--church-ink-muted)]">
                    {item.caption}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="bg-[var(--church-navy)] px-6 py-20 text-white sm:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="church-premium__eyebrow text-[var(--church-gold-soft)]">
                Life at Shanah City
              </p>
              <h2 className="church-premium__title mt-3 text-[clamp(2rem,4vw,3.25rem)] text-white">
                Upcoming gatherings
              </h2>
            </div>
            <a
              href="/events"
              className="rounded-full border border-white/35 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              View all events
            </a>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {upcomingEvents.length ? (
              upcomingEvents.map(({ event, occurrenceDate }) => {
                const { meta } = formatHomeEventMeta(event, occurrenceDate);
                const image =
                  event.artworkWideUrl ||
                  event.artworkBannerUrl ||
                  event.artworkSquareUrl ||
                  "/home/home-gallery-16.jpg";
                return (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="aspect-[16/10] w-full object-cover" />
                    <div className="p-6">
                      <p className="text-xs font-semibold tracking-wide text-[var(--church-gold)]">
                        {meta}
                      </p>
                      <h3 className="mt-2 font-display text-xl font-semibold">{event.title}</h3>
                      {event.location ? (
                        <p className="mt-1 text-sm text-white/75">{event.location}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="md:col-span-3 text-white/80">
                Join us Sunday at 10:00 AM — check back soon for special events.
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="messages" className="scroll-mt-20 px-6 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <a href="/messages" className="group relative block overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sermonThumb}
              alt=""
              className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--church-navy-deep)]/80 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--church-navy)]">
              Play message
            </span>
          </a>
          <div>
            <p className="church-premium__eyebrow">Latest sermon</p>
            <h2 className="church-premium__title mt-3 text-[clamp(2rem,4vw,3rem)]">{sermonTitle}</h2>
            {sermonDate ? (
              <p className="mt-2 text-sm text-[var(--church-ink-muted)]">{sermonDate}</p>
            ) : null}
            <p className="mt-5 max-w-md text-base leading-8 text-[var(--church-ink-muted)]">
              Carry Sunday into the week — explore messages, daily devotions, and practical
              next steps for your walk with God.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/messages" className="church-premium__btn-primary !bg-[var(--church-navy)] !text-white hover:!bg-[#0d3158]">
                Explore sermons
              </a>
              <a
                href="/devotions"
                className="rounded-full border border-sand-300 px-5 py-3 text-sm font-semibold text-[var(--church-navy)] hover:bg-sand-50"
              >
                Daily devotions
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-2xl border border-sand-200 bg-white p-8 shadow-[0_16px_40px_rgba(16,38,74,0.08)] sm:p-12 lg:grid-cols-[1fr_11rem]">
          <div>
            <p className="church-premium__eyebrow">Stay connected</p>
            <h2 className="church-premium__title mt-3 text-[clamp(2rem,4vw,3rem)]">
              Your church family, in your pocket.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-[var(--church-ink-muted)]">
              Sermons, devotions, events, prayer, and community — with the official Shanah City
              app for iOS and Android.
            </p>
            <a href="/app" className="church-premium__btn-primary mt-8">
              Get the free app
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-store-screenshots/01-home-1242x2688.png"
            alt="Shanah City app home screen"
            className="mx-auto w-[10.5rem] rounded-[1.75rem] border-[6px] border-night-900 shadow-xl"
          />
        </div>
      </section>

      <section className="border-t border-sand-200 bg-sand-50 px-6 py-16 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandLogos.default} alt="" className="h-10 w-auto opacity-90" />
            <p className="max-w-md text-sm leading-7 text-[var(--church-ink-muted)]">
              Generosity fuels ministry to families and our community in Aurora.
            </p>
          </div>
          <a
            href="/give"
            className="rounded-full bg-clay-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-clay-500"
          >
            Give online
          </a>
        </div>
      </section>
    </main>
  );
}
