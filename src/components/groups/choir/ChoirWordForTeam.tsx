import { CHOIR_HERO_IMAGE_PATH, CHOIR_WORD_FOR_TEAM } from "@/lib/choir-group-constants";

export function ChoirWordForTeam() {
  return (
    <section className="choir-word-card" aria-labelledby="choir-word-heading">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHOIR_HERO_IMAGE_PATH} alt="" />
      <div className="choir-word-overlay" />
      <div className="choir-word-copy">
        <p id="choir-word-heading" className="choir-section-label text-white/80">
          Word for the team
        </p>
        <p className="mt-2 font-display text-base leading-relaxed text-white">
          &ldquo;{CHOIR_WORD_FOR_TEAM.text}&rdquo;
        </p>
        <p className="mt-3 text-xs font-semibold text-[var(--choir-gold-soft)]">
          {CHOIR_WORD_FOR_TEAM.reference}
        </p>
      </div>
    </section>
  );
}
