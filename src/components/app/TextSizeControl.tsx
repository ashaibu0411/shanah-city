"use client";

import {
  TEXT_SCALE_STEPS,
  useReadability,
  type TextScale,
} from "@/components/app/ReadabilityProvider";

type TextSizeControlProps = {
  variant?: "mobile" | "desktop";
};

export function TextSizeControl({ variant = "mobile" }: TextSizeControlProps) {
  const {
    textScale,
    setTextScale,
    decreaseTextScale,
    increaseTextScale,
    canDecrease,
    canIncrease,
  } = useReadability();

  const isMobile = variant === "mobile";
  const currentLabel =
    TEXT_SCALE_STEPS.find((step) => step.id === textScale)?.label ?? "Standard";

  const buttonBase = isMobile
    ? "rounded-lg px-2 py-2.5 text-xs font-bold transition"
    : "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition";

  const activeClass = isMobile
    ? "bg-night-950 text-white"
    : "bg-night-900 text-sand-50";

  const inactiveClass = isMobile
    ? "text-night-700 hover:bg-sand-100"
    : "text-night-700 hover:bg-night-900/5";

  const stepButtonClass = isMobile
    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-night-800 ring-1 ring-night-900/10 transition enabled:hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-35"
    : "flex h-9 w-9 items-center justify-center rounded-xl border border-night-900/10 bg-white text-base font-bold text-night-800 transition enabled:hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className={isMobile ? "" : "flex items-center gap-3"}>
      {!isMobile && (
        <div className="hidden min-w-[7.5rem] lg:block">
          <p className="text-xs font-semibold text-night-900">Reading size</p>
          <p className="text-[11px] text-night-500">{currentLabel}</p>
        </div>
      )}

      {isMobile && (
        <>
          <p className="text-sm font-semibold text-night-900">Reading size</p>
          <p className="mt-0.5 text-sm text-night-600">
            Applies on every page. Pinch to zoom still works too.
          </p>
        </>
      )}

      <div className={isMobile ? "mt-3 space-y-3" : "flex items-center gap-2"}>
        <div className={`flex items-center gap-2 ${isMobile ? "" : ""}`}>
          <button
            type="button"
            aria-label="Decrease text size"
            disabled={!canDecrease}
            onClick={decreaseTextScale}
            className={stepButtonClass}
          >
            A−
          </button>
          <p
            className={
              isMobile
                ? "min-w-[5.5rem] text-center text-xs font-semibold uppercase tracking-[0.16em] text-night-600"
                : "min-w-[4.5rem] text-center text-[11px] font-semibold text-night-600 lg:hidden"
            }
          >
            {currentLabel}
          </p>
          <button
            type="button"
            aria-label="Increase text size"
            disabled={!canIncrease}
            onClick={increaseTextScale}
            className={stepButtonClass}
          >
            A+
          </button>
        </div>

        <div
          className={
            isMobile
              ? "grid grid-cols-4 gap-1 rounded-xl bg-sand-100/90 p-1 ring-1 ring-night-900/8"
              : "hidden"
          }
          role="group"
          aria-label="Reading size presets"
        >
          {TEXT_SCALE_STEPS.map((option) => (
            <PresetButton
              key={option.id}
              option={option}
              active={textScale === option.id}
              buttonBase={buttonBase}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              onSelect={setTextScale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PresetButton({
  option,
  active,
  buttonBase,
  activeClass,
  inactiveClass,
  onSelect,
}: {
  option: (typeof TEXT_SCALE_STEPS)[number];
  active: boolean;
  buttonBase: string;
  activeClass: string;
  inactiveClass: string;
  onSelect: (scale: TextScale) => void;
}) {
  const shortLabel =
    option.id === "extraLarge"
      ? "XL"
      : option.id === "comfortable"
        ? "Std"
        : option.label.split(" ")[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className={`${buttonBase} ${active ? activeClass : inactiveClass}`}
      aria-pressed={active}
    >
      {shortLabel}
    </button>
  );
}
