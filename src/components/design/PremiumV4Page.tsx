import type { CSSProperties, ReactNode } from "react";
import type { PremiumV4Theme } from "@/lib/premium-v4-design-system";

type ShellProps = {
  theme: PremiumV4Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Explicit, page-local V4 opt-in. Never attach to application root by default. */
export function PremiumV4Page({ theme, children, className = "", style }: ShellProps) {
  return (
    <div className={`sc-v4 ${className}`.trim()} data-sc-theme={theme} style={style}>
      {children}
    </div>
  );
}

export function PremiumV4PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sc-v4__header">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="sc-v4__eyebrow">{eyebrow}</p> : null}
          <h1 className="sc-v4__title">{title}</h1>
          {description ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#f6ebd5]">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function PremiumV4Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`sc-v4__card p-4 sm:p-5 ${className}`.trim()}>{children}</section>;
}
