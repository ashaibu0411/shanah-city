"use client";

import Link from "next/link";
import { useAppShell } from "@/components/app/AppShellContext";
import { premiumDesktopQuickActions, premiumMobileLauncherActions } from "@/lib/home-premium";
import { PremiumQuickActionIcon } from "@/components/home/premium/PremiumHomeIcons";

export function PremiumQuickActions() {
  return (
    <section className="premium-section" aria-label="Quick actions">
      <div className="premium-quick-grid">
        {premiumDesktopQuickActions.map((action) => (
          <Link key={action.id} href={action.href} className="premium-quick-card">
            <span className={`premium-icon-well ${action.wellClass}`}>
              <PremiumQuickActionIcon id={action.id} className="h-5 w-5" />
            </span>
            <span className="premium-quick-card__text">
              <span className="premium-quick-card__label">{action.label}</span>
              <span className="premium-quick-card__desc">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PremiumMobileLauncher() {
  const { setMoreMenuOpen } = useAppShell();

  return (
    <section className="premium-launcher" aria-label="Quick launcher">
      <div className="premium-launcher__grid">
        {premiumMobileLauncherActions.map((action) => {
          const inner = (
            <>
              <span className={`premium-icon-well premium-icon-well--compact ${action.wellClass}`}>
                <PremiumQuickActionIcon id={action.id} className="h-6 w-6" />
              </span>
              <span className="premium-launcher__label">{action.label}</span>
            </>
          );

          if (action.href === "__more__") {
            return (
              <button
                key={action.id}
                type="button"
                className="premium-launcher__tile"
                onClick={() => setMoreMenuOpen(true)}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link key={action.id} href={action.href} className="premium-launcher__tile">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
