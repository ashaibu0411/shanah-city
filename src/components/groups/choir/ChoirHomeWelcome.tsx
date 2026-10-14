import { CHOIR_BRAND_TAGLINE } from "@/lib/choir-group-constants";

export function ChoirHomeWelcome() {
  return (
    <section className="choir-home-welcome choir-card px-4 py-3" aria-labelledby="choir-home-welcome-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--choir-gold-dark)]">
        Shanah Worship
      </p>
      <h2 id="choir-home-welcome-heading" className="mt-1 font-display text-lg font-bold text-[var(--choir-heading)]">
        Welcome to Shanah Worship
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--choir-body)]">
        Stay connected, prepared, and ready to serve.
      </p>
      <p className="mt-0.5 text-xs text-[var(--choir-muted)]">{CHOIR_BRAND_TAGLINE}</p>
    </section>
  );
}
