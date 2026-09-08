import { site } from "@/lib/site";

type HomeTaglineProps = {
  size?: "mobile" | "desktop";
  /** Light = sand card with navy type; dark = hero on navy (desktop). */
  tone?: "light" | "dark";
};

export function HomeTagline({ size = "mobile", tone = "dark" }: HomeTaglineProps) {
  const isDesktop = size === "desktop";
  const isLight = tone === "light";

  return (
    <>
      <p
        className={`font-sans font-semibold uppercase tracking-[0.28em] ${
          isDesktop
            ? "text-xs text-sand-300"
            : isLight
              ? "mobile-home-fade-up mobile-home-fade-up-1 text-[10px] text-teal-800/75"
              : "mobile-home-fade-up mobile-home-fade-up-1 text-[10px] text-amber-100/95 drop-shadow-[0_1px_10px_rgba(11,18,32,0.75)]"
        }`}
      >
        {site.heroChurchName}
      </p>
      <h1
        className={`font-home-hero font-semibold leading-[1.12] tracking-tight text-balance ${
          isDesktop
            ? "mt-4 text-3xl text-white md:text-4xl lg:text-[2.75rem]"
            : isLight
              ? "mt-2.5 text-[1.45rem] text-night-900"
              : "mt-3 text-[1.55rem] text-white drop-shadow-[0_2px_18px_rgba(11,18,32,0.72)]"
        }`}
      >
        {site.tagline}{" "}
        <span
          className={
            isDesktop ? "text-sand-200" : isLight ? "text-amber-700" : "text-amber-300 drop-shadow-[0_1px_12px_rgba(11,18,32,0.65)]"
          }
        >
          {site.taglineReference}
        </span>
      </h1>
    </>
  );
}
