"use client";

import { editorialPremium, formatEditorialSectionLabel } from "@/components/app/editorial-premium";

type MobilePageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  sectionIndex?: number;
  accentWord?: string;
  className?: string;
  children?: React.ReactNode;
};

function EditorialTitle({ title, accentWord }: { title: string; accentWord?: string }) {
  if (!accentWord || !title.includes(accentWord)) {
    return <>{title}</>;
  }

  const parts = title.split(accentWord);
  return (
    <>
      {parts[0]}
      <span className="text-clay-600">{accentWord}</span>
      {parts.slice(1).join(accentWord)}
    </>
  );
}

export function MobilePageHero({
  eyebrow,
  title,
  description,
  sectionIndex,
  accentWord,
  className = "",
  children,
}: MobilePageHeroProps) {
  const eyebrowText =
    eyebrow && sectionIndex != null
      ? formatEditorialSectionLabel(sectionIndex, eyebrow)
      : eyebrow;

  return (
    <div className={`${editorialPremium.pageHeader} ${className}`}>
      {eyebrowText ? (
        <p className={editorialPremium.pageEyebrow}>{eyebrowText}</p>
      ) : null}
      <h1 className={editorialPremium.pageTitle}>
        <EditorialTitle title={title} accentWord={accentWord} />
      </h1>
      {description ? (
        <p className={editorialPremium.pageDescription}>{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
