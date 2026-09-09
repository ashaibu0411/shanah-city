type MobilePremiumFrameProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "surface" | "hero" | "cinema";
};

/** Wraps content with premium 4K bezel, grain, and depth — used on heroes and cards app-wide. */
export function MobilePremiumFrame({
  children,
  className = "",
  variant = "surface",
}: MobilePremiumFrameProps) {
  return (
    <div
      className={`mobile-premium-frame mobile-premium-frame--${variant} relative overflow-hidden ${className}`}
    >
      {variant !== "surface" ? (
        <>
          <div className="mobile-premium-4k__shine pointer-events-none absolute inset-0 z-10" aria-hidden />
          <div className="mobile-premium-4k__grain pointer-events-none absolute inset-0 z-10" aria-hidden />
        </>
      ) : null}
      <div className="mobile-premium-4k__bezel pointer-events-none absolute inset-0 z-20" aria-hidden />
      <div className="relative z-0 h-full w-full">{children}</div>
    </div>
  );
}
