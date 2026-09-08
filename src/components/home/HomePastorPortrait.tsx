import { site } from "@/lib/site";

type HomePastorPortraitProps = {
  variant?: "mobile" | "desktop";
  className?: string;
};

/** Blended lead pastor portrait for home tagline heroes. */
export function HomePastorPortrait({
  variant = "mobile",
  className = "",
}: HomePastorPortraitProps) {
  return (
    <div
      className={`home-pastor-portrait home-pastor-portrait--${variant} pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={site.pastorPortrait}
        alt=""
        decoding="async"
        className="home-pastor-portrait__photo"
      />
      <div className="home-pastor-portrait__scrim absolute inset-0" />
    </div>
  );
}
