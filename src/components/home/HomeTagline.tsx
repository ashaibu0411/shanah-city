import { site } from "@/lib/site";

type HomeTaglineProps = {
  size?: "mobile" | "desktop";
};

export function HomeTagline({ size = "mobile" }: HomeTaglineProps) {
  const isDesktop = size === "desktop";

  return (
    <>
      <p
        className={`font-sans font-semibold uppercase tracking-[0.28em] text-amber-100/90 ${
          isDesktop ? "text-xs text-sand-300" : "mobile-home-fade-up mobile-home-fade-up-1 text-[10px]"
        }`}
      >
        {site.heroChurchName}
      </p>
      <h1
        className={`font-home-hero font-semibold leading-[1.12] tracking-tight text-balance text-white ${
          isDesktop
            ? "mt-4 text-3xl md:text-4xl lg:text-[2.75rem]"
            : "mt-3 text-[1.55rem]"
        }`}
      >
        {site.tagline}{" "}
        <span className={isDesktop ? "text-sand-200" : "text-amber-300"}>
          {site.taglineReference}
        </span>
      </h1>
    </>
  );
}
