import Image from "next/image";
import { ChurchSiteAnnouncementBar } from "@/components/church-site/ChurchSiteAnnouncementBar";
import type { ChurchSiteBanner } from "@/lib/church-site-banner";
import {
  formatHomeEventMeta,
  type HomeUpcomingEventRow,
} from "@/lib/home-upcoming-events";
import { homeSermonDisplayTitle, homeSermonInlineThumbnail } from "@/lib/home-sermon-display";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";
import { site } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";

const HERO_WORSHIP = "/home/home-gallery-88.jpg";
const HERO_FELLOWSHIP = "/home/home-gallery-12.jpg";
const WELCOME_PHOTO = "/home/home-gallery-08.jpg";
const VISIT_PHOTO = "/home/home-gallery-15.jpg";

const ministryTiles = [
  { title: "Men of Legacy", href: "/ministries", image: "/home/home-gallery-25.jpg" },
  { title: "Transformed Women", href: "/ministries", image: "/home/home-gallery-29.jpg" },
  { title: "Young Adults", href: "/ministries", image: "/home/home-gallery-32.jpg" },
  { title: "Shanah Worship", href: "/ministries", image: "/home/home-gallery-07.jpg" },
  { title: "Shanah Kids & Teens", href: "/ministries", image: "/home/home-gallery-17.jpg" },
  { title: "Power Couples", href: "/ministries", image: "/home/home-gallery-22.jpg" },
] as const;

const facePhotos = ["/home/home-gallery-19.jpg", "/home/home-gallery-27.jpg", "/home/home-gallery-33.jpg"] as const;

type ChurchSiteHomeProps = {
  upcomingEvents: HomeUpcomingEventRow[];
  latestSermon: SermonVideo | null;
  banner?: ChurchSiteBanner | null;
};

function worshipSchedule() {
  const friday = site.serviceTimes.find((s) => s.day.toLowerCase().includes("friday"));
  const sunday = site.serviceTimes.find((s) => s.day.toLowerCase().includes("sunday"));
  return { friday, sunday };
}

function eventArtwork(event: ChurchEvent) {
  return (
    event.artworkWideUrl ||
    event.artworkBannerUrl ||
    event.artworkSquareUrl ||
    "/home/home-gallery-26.jpg"
  );
}

function serviceTimeShort(time: string) {
  return time.split("–")[0].trim();
}

export function ChurchSiteHome({ upcomingEvents, latestSermon, banner = null }: ChurchSiteHomeProps) {
  const { friday, sunday } = worshipSchedule();
  const sermonThumb = homeSermonInlineThumbnail(
    latestSermon?.thumbnailUrl ?? "/home/home-gallery-12.jpg",
  );
  const sermonTitle = homeSermonDisplayTitle(latestSermon?.title ?? "Watch our latest message");
  const sermonDate = latestSermon?.publishedAt ? formatSermonDate(latestSermon.publishedAt) : null;
  const events = upcomingEvents.slice(0, 4);
  const featured = events[0];
  const secondary = events.slice(1);

  const worshipPanel = (
    <>
      <p className="church-v5-hero__panel-eyebrow">Worship with us</p>
      {sunday ? (
        <p>
          <strong>Sundays</strong>
          <br />
          {serviceTimeShort(sunday.time)}
        </p>
      ) : null}
      {friday ? (
        <p>
          <strong>Glory Encounter Service</strong>
          <br />
          Fridays at {serviceTimeShort(friday.time)}
        </p>
      ) : null}
      <a href="/visit">
        Plan Your Visit <span aria-hidden>→</span>
      </a>
    </>
  );

  return (
    <main className="church-v5-main">
      <ChurchSiteAnnouncementBar banner={banner} />

      <section className="church-v5-hero" aria-label="Welcome">
        <div className="church-v5__container">
          <div className="church-v5-hero__headline-wrap">
            <h1 className="church-v5-hero__title church-v5__display">
              <span className="block">Changing lives to</span>
              <span className="block">higher levels in God.</span>
            </h1>
            <p className="church-v5-hero__scripture">{site.scripture}</p>
          </div>

          <div className="church-v5-hero__grid">
            <div className="church-v5-hero__col-right">
              <div className="church-v5-hero__photo church-v5-hero__photo--tall">
                <Image
                  src={HERO_WORSHIP}
                  alt="Shanah City worship"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover object-[center_35%]"
                />
                <div className="church-v5-hero__panel">{worshipPanel}</div>
                <p className="church-v5-hero__caption church-v5-hero__caption--left">
                  <span>
                    Encounter God.
                    <br />
                    <em>Discover Purpose.</em>
                  </span>
                </p>
              </div>
              <div className="church-v5-hero__panel church-v5-hero__panel--below lg:hidden">{worshipPanel}</div>
            </div>

            <div className="church-v5-hero__col-left">
              <p className="church-v5-hero__support">
                Find your purpose, experience God&apos;s presence and discover a community where you belong.
              </p>
              <p className="church-v5-hero__tag">Faith. Family. Transformation.</p>
              <ul className="church-v5-hero__faces" aria-hidden>
                {facePhotos.map((src) => (
                  <li key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </li>
                ))}
              </ul>
              <div className="church-v5-hero__photo church-v5-hero__photo--wide">
                <Image
                  src={HERO_FELLOWSHIP}
                  alt="Shanah City community in fellowship"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <p className="church-v5-hero__caption">There is a place for you here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="church-v5-section scroll-mt-28" aria-labelledby="v5-welcome-heading">
        <div className="church-v5__container church-v5-welcome">
          <div>
            <h2 id="v5-welcome-heading" className="church-v5__section-title">
              A place to belong.
              <br />
              A place to become.
            </h2>
            <p className="church-v5__body mt-5 max-w-lg">{site.description}</p>
            <p className="mt-4 text-base font-medium text-[var(--v5-navy)]">{site.welcome}</p>
            <a href="/about" className="church-v5__link church-v5__link--gold mt-6 inline-block">
              About us →
            </a>
          </div>
          <Image
            src={WELCOME_PHOTO}
            alt="Shanah City church family"
            width={1200}
            height={1000}
            className="church-v5-welcome__photo"
          />
        </div>
      </section>

      <section className="church-v5-section" aria-labelledby="v5-visit-heading">
        <div className="church-v5__container">
          <h2 id="v5-visit-heading" className="church-v5__section-title">
            Your first Sunday
          </h2>
          <p className="church-v5__body mt-4 max-w-2xl">
            Come as you are. From worship and the Word to warm hospitality, we want your first visit to feel
            welcoming and clear.
          </p>
          <div className="church-v5-visit mt-10">
            <div className="church-v5-visit__card">
              <p className="text-sm font-semibold text-[var(--v5-navy)]">Service &amp; location</p>
              <ul className="church-v5-visit__list">
                {sunday ? (
                  <li>
                    <strong>Sunday worship</strong> · {sunday.time}
                  </li>
                ) : null}
                {friday ? (
                  <li>
                    <strong>Glory Encounter Service</strong> · {friday.day} · {friday.time}
                  </li>
                ) : null}
                <li>{site.address}</li>
                <li>{site.visitInfo.duration}</li>
                <li>
                  Families welcome — Shanah Kids and Teens support children and students on Sunday.
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/visit" className="church-v5__pill">
                  Plan Your Visit
                </a>
                <a
                  href={site.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="church-v5__pill church-v5__pill--outline"
                >
                  Directions
                </a>
              </div>
            </div>
            <Image
              src={VISIT_PHOTO}
              alt="Welcome at Shanah City"
              width={1100}
              height={900}
              className="church-v5-welcome__photo"
            />
          </div>
        </div>
      </section>

      <section id="ministries" className="church-v5-section scroll-mt-28" aria-labelledby="v5-ministries-heading">
        <div className="church-v5__container">
          <div className="church-v5-ministries__lead">
            <h2 id="v5-ministries-heading" className="church-v5__section-title">
              Find your community
            </h2>
            <p className="church-v5__body mt-4">
              Grow in faith, build meaningful relationships, and serve with purpose through our ministries.
            </p>
            <a href="/ministries" className="church-v5__link mt-5 inline-block">
              Explore all ministries →
            </a>
          </div>
          <div className="church-v5-ministries__mosaic">
            {ministryTiles.map((item) => (
              <a key={item.title} href={item.href} className="church-v5-ministry-tile">
                <Image src={item.image} alt="" fill sizes="(max-width: 900px) 50vw, 25vw" className="object-cover" />
                <span className="church-v5-ministry-tile__scrim" aria-hidden />
                <span className="church-v5-ministry-tile__label">{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="church-v5-section scroll-mt-28" aria-labelledby="v5-events-heading">
        <div className="church-v5__container">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="v5-events-heading" className="church-v5__section-title">
              What&apos;s happening
            </h2>
            <a href="/events" className="church-v5__link church-v5__link--gold">
              View all events →
            </a>
          </div>

          {featured ? (
            <a href="/events" className="church-v5-events__feature mt-8 block">
              <Image
                src={eventArtwork(featured.event)}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 80vw"
                className="object-cover"
              />
              <div className="church-v5-events__feature-body">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  {formatHomeEventMeta(featured.event, featured.occurrenceDate).meta}
                </p>
                <p className="mt-2 text-2xl font-semibold leading-tight">{featured.event.title}</p>
              </div>
            </a>
          ) : (
            <p className="church-v5__body mt-6">
              Join us Sunday at {sunday ? serviceTimeShort(sunday.time) : "10:00 AM"}. Check back for special
              gatherings.
            </p>
          )}

          <div className="mt-4">
            {secondary.map(({ event, occurrenceDate }) => {
              const { day, meta } = formatHomeEventMeta(event, occurrenceDate);
              const month = day?.toLocaleDateString(undefined, { month: "short" }).toUpperCase() ?? "—";
              const dayNum = day?.getDate() ?? "·";
              return (
                <a key={`${event.id}-${occurrenceDate}`} href="/events" className="church-v5-event-row">
                  <span className="church-v5-event-row__date">
                    {month}
                    <span>{dayNum}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--v5-ink)]">{event.title}</span>
                    <span className="church-v5__body block text-sm">{meta}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="church-v5-section" aria-labelledby="v5-sermon-heading">
        <div className="church-v5__container church-v5-sermon">
          <a href="/messages" className="church-v5-sermon__thumb">
            <Image src={sermonThumb} alt="" fill sizes="(max-width: 900px) 100vw, 55vw" className="object-cover" />
          </a>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--v5-muted)]">Latest message</p>
            <h2 id="v5-sermon-heading" className="church-v5__section-title mt-3 text-[clamp(1.35rem,2.5vw,2rem)]">
              {sermonTitle}
            </h2>
            <p className="church-v5__body mt-2">{site.leadPastor}</p>
            {sermonDate ? <p className="mt-1 text-sm text-[var(--v5-muted)]">{sermonDate}</p> : null}
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="/messages" className="church-v5__link">
                Watch message →
              </a>
              <a href="/messages" className="church-v5__link church-v5__link--gold">
                Explore messages →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="church-v5-section" aria-labelledby="v5-give-heading">
        <div className="church-v5__container">
          <div className="church-v5-give">
            <div>
              <h2 id="v5-give-heading" className="church-v5-give__title">
                Generosity fuels the mission
              </h2>
              <p className="church-v5-give__copy">
                Your giving helps us worship, disciple families, serve our city, and share the Gospel.
              </p>
            </div>
            <a href="/give" className="church-v5__pill">
              Give online →
            </a>
          </div>
        </div>
      </section>

      <section className="church-v5-section" aria-labelledby="v5-app-heading">
        <div className="church-v5__container church-v5-app">
          <div>
            <h2 id="v5-app-heading" className="church-v5__section-title">
              The Shanah City app
            </h2>
            <p className="church-v5__body mt-4 max-w-xl">
              Sermons, devotions, events, prayer, groups, and giving — stay connected to your church family on
              iOS and Android.
            </p>
            <a href="/app" className="church-v5__pill mt-6 inline-flex">
              Download the app
            </a>
          </div>
          <Image
            src="/app-store-screenshots/01-home-1284x2778.png"
            alt="Shanah City app home screen"
            width={428}
            height={926}
            className="church-v5-app__shot"
          />
        </div>
      </section>
    </main>
  );
}
