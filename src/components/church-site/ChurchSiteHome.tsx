import { StripIcon } from "@/components/church-site/ChurchSiteFrame";
import {
  formatHomeEventMeta,
  type HomeUpcomingEventRow,
} from "@/lib/home-upcoming-events";
import { homeSermonDisplayTitle, homeSermonInlineThumbnail } from "@/lib/home-sermon-display";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";
import { site } from "@/lib/site";

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
] as const;

type ChurchSiteHomeProps = {
  upcomingEvents: HomeUpcomingEventRow[];
  latestSermon: SermonVideo | null;
};

export function ChurchSiteHome({ upcomingEvents, latestSermon }: ChurchSiteHomeProps) {
  const sermonThumb = homeSermonInlineThumbnail(
    latestSermon?.thumbnailUrl ?? "/home/home-gallery-12.jpg",
  );
  const sermonTitle = homeSermonDisplayTitle(latestSermon?.title ?? "Watch our latest message");
  const sermonDate = latestSermon?.publishedAt ? formatSermonDate(latestSermon.publishedAt) : null;
  const events = upcomingEvents.slice(0, 4);

  return (
    <main>
      <section className="church-premium-hero" aria-label="Welcome">
        <div
          className="church-premium-hero__media"
          style={{ backgroundImage: "url('/home/home-gallery-36.jpg')" }}
          role="img"
          aria-label="Shanah City worship gathering"
        />
        <div className="church-premium-hero__scrim" aria-hidden />
        <div className="church-premium__container church-premium-hero__content">
          <p className="church-premium__eyebrow text-[var(--church-gold-soft)]">Shanah City Church</p>
          <h1 className="church-premium-hero__title">Changing Lives to Higher Levels in God.</h1>
          <p className="church-premium-hero__copy">
            A diverse, family-oriented church in Aurora, Colorado — where people meet Jesus, grow in
            God&apos;s Word, and experience life-giving relationships.
          </p>
          <div className="church-premium-hero__actions">
            <a href="/messages" className="church-premium__btn-primary">
              Watch live
            </a>
            <a href="/visit" className="church-premium__btn-ghost">
              Plan your visit
            </a>
          </div>
        </div>
      </section>

      <section className="church-premium-strip" aria-label="Visit essentials">
        <div className="church-premium__container church-premium-strip__grid">
          <div className="church-premium-strip__item">
            <StripIcon>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </StripIcon>
            <div>
              <p className="church-premium-strip__label">Sunday worship</p>
              <p className="church-premium-strip__meta">10:00 AM</p>
            </div>
          </div>
          <div className="church-premium-strip__item">
            <StripIcon>
              <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </StripIcon>
            <div>
              <p className="church-premium-strip__label">Our location</p>
              <p className="church-premium-strip__meta">
                <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
                  {site.address}
                </a>
              </p>
            </div>
          </div>
          <div className="church-premium-strip__item">
            <StripIcon>
              <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="8" r="3.5" />
              <path d="M23 20v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 4.13a4 4 0 0 1 0 7.75" />
            </StripIcon>
            <div>
              <p className="church-premium-strip__label">A place for everyone</p>
              <p className="church-premium-strip__meta">
                All generations. All backgrounds. One family.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="ministries" className="church-premium-ministries scroll-mt-24">
        <div className="church-premium__container church-premium-ministries__grid">
          <div>
            <p className="church-premium__eyebrow">Ministries</p>
            <h2 className="church-premium__title mt-3 text-[clamp(1.85rem,4vw,2.75rem)]">
              Find your community.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[var(--church-ink-muted)]">
              Grow in faith, build meaningful relationships, and serve with purpose through our
              ministries.
            </p>
            <a href="/ministries" className="church-premium__btn-outline mt-6 inline-flex">
              Explore all ministries →
            </a>
          </div>
          <div className="church-premium-ministries__cards">
            {ministries.map((item) => (
              <a key={item.title} href={item.href} className="church-premium-ministry-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="church-premium-ministry-card__image" />
                <div className="church-premium-ministry-card__scrim" aria-hidden />
                <div className="church-premium-ministry-card__body">
                  <p className="church-premium-ministry-card__title">{item.title}</p>
                  <p className="church-premium-ministry-card__copy">{item.caption}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="church-premium-band scroll-mt-24" aria-labelledby="church-events-heading">
        <div className="church-premium__container church-premium-band__grid">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="church-events-heading" className="church-premium__title text-white text-[clamp(1.65rem,3.5vw,2.25rem)]">
                What&apos;s happening at Shanah City
              </h2>
              <a href="/events" className="church-premium__link church-premium__link--gold">
                View all events →
              </a>
            </div>
            <div className="mt-4">
              {events.length > 0 ? (
                events.map(({ event, occurrenceDate }) => {
                  const { day, meta } = formatHomeEventMeta(event, occurrenceDate);
                  const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase() ?? "—";
                  const dayNum = day?.getDate() ?? "·";
                  return (
                    <a
                      key={`${event.id}-${occurrenceDate}`}
                      href="/events"
                      className="church-premium-event-row"
                    >
                      <span className="church-premium-event-row__date">
                        <span className="church-premium-event-row__month">{month}</span>
                        <span className="church-premium-event-row__day">{dayNum}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="church-premium-event-row__title">{event.title}</span>
                        <span className="church-premium-event-row__meta block">{meta}</span>
                        {event.location?.trim() ? (
                          <span className="church-premium-event-row__meta block">{event.location}</span>
                        ) : null}
                      </span>
                      <span className="text-[var(--church-gold)]" aria-hidden>
                        →
                      </span>
                    </a>
                  );
                })
              ) : (
                <p className="text-sm text-white/78 py-2">
                  Join us Sunday at 10:00 AM. Check back soon for special gatherings.
                </p>
              )}
            </div>
          </div>

          <div className="church-premium-sermon">
            <p className="church-premium__eyebrow text-[var(--church-gold-soft)]">Latest sermon</p>
            <a href="/messages" className="church-premium-sermon__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sermonThumb} alt="" />
              <span className="church-premium-sermon__play" aria-hidden>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-sm text-[var(--church-navy)]">
                  ▶
                </span>
              </span>
            </a>
            <SermonFeatureCopy title={sermonTitle} date={sermonDate} />
          </div>

          <div className="church-premium-give-card">
            <div>
              <p className="church-premium__eyebrow text-[var(--church-midnight)]/80">Give</p>
              <h2 className="church-premium-give-card__title mt-2">Support the vision</h2>
              <p className="church-premium-give-card__copy">
                Your generosity helps us change lives and serve our community.
              </p>
            </div>
            <a href="/give" className="church-premium__btn-primary">
              Give online →
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="church-premium-welcome scroll-mt-24">
        <div className="church-premium__container grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="church-premium__eyebrow">Welcome</p>
            <h2 className="church-premium__title mt-3 text-[clamp(1.85rem,4vw,2.75rem)]">
              There is room for you here.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-[var(--church-ink-muted)]">
              {site.description}
            </p>
            <p className="mt-3 text-base font-semibold text-[var(--church-navy)]">{site.welcome}</p>
            <a href="/about" className="church-premium__link church-premium__link--gold mt-6 inline-block">
              Discover our story →
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home/home-gallery-08.jpg"
            alt="Shanah City church family"
            className="aspect-[5/4] w-full rounded-xl object-cover"
          />
        </div>
      </section>

      <section className="church-premium-app">
        <div className="church-premium__container church-premium-app__card">
          <div>
            <p className="church-premium__eyebrow">Stay connected</p>
            <h2 className="church-premium__title mt-3 text-[clamp(1.65rem,3.5vw,2.25rem)]">
              Your church family, in your pocket.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--church-ink-muted)]">
              Sermons, devotions, events, prayer, and community — with the official Shanah City app for
              iOS and Android.
            </p>
            <a href="/app" className="church-premium__btn-primary mt-6 inline-flex">
              Get the free app
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-store-screenshots/01-home-1284x2778.png"
            alt="Shanah City app home screen"
            className="church-premium-app__shot mx-auto"
          />
        </div>
      </section>
    </main>
  );
}

function SermonFeatureCopy({ title, date }: { title: string; date: string | null }) {
  return (
    <div>
      <h3 className="church-premium__title text-white text-lg leading-snug">{title}</h3>
      <p className="mt-1 text-sm text-white/75">{site.leadPastor}</p>
      {date ? <p className="mt-1 text-xs text-white/60">{date}</p> : null}
      <a href="/messages" className="church-premium__link church-premium__link--gold mt-3 inline-block text-sm">
        Watch message →
      </a>
    </div>
  );
}