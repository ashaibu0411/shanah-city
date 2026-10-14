import { CHOIR_BRAND_TAGLINE, CHOIR_HOME_WELCOME_IMAGE_PATH } from "@/lib/choir-group-constants";

export function ChoirHomeWelcome() {
  return (
    <section
      className="choir-home-welcome choir-home-welcome-photo"
      aria-labelledby="choir-home-welcome-heading"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHOIR_HOME_WELCOME_IMAGE_PATH} alt="" className="choir-home-welcome-bg" />
      <div className="choir-home-welcome-overlay" aria-hidden />
      <div className="choir-home-welcome-copy">
        <p className="choir-home-welcome-eyebrow">Shanah Worship</p>
        <h2 id="choir-home-welcome-heading" className="choir-home-welcome-title">
          Welcome to Shanah Worship
        </h2>
        <p className="choir-home-welcome-lead">Stay connected, prepared, and ready to serve.</p>
        <p className="choir-home-welcome-tagline">{CHOIR_BRAND_TAGLINE}</p>
      </div>
    </section>
  );
}
