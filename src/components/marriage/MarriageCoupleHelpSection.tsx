"use client";

import { useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

const topics = [
  {
    id: "accounts",
    title: "Why separate partner accounts?",
    body: "Each of you signs in individually so consent, private answers, and counselor feedback stay tied to the right person. Sharing one login would blur those boundaries.",
  },
  {
    id: "consent",
    title: "Why individual consent?",
    body: "Before assessments begin, each partner confirms how answers may be shared. Shared comparison items appear only after both of you submit — never your private drafts.",
  },
  {
    id: "assessments",
    title: "What are assessments for?",
    body: "Modules help you reflect and prepare for conversations with your counselor. They support pastoral preparation — not diagnosis, therapy, or legal advice.",
  },
  {
    id: "homework",
    title: "How does homework work?",
    body: "Your counselor releases assignments after sessions. You save progress privately and submit when ready. Written prompts include examples; your answers stay yours unless a question is designed for sharing after submit.",
  },
  {
    id: "counselor",
    title: "What can your counselor see?",
    body: "With your consent, an assigned counselor may view submitted assessments, released homework, and session scheduling. Private counselor notes and Senior Pastor readiness reviews are not shown to couples.",
  },
  {
    id: "partner",
    title: "What stays private between partners?",
    body: "Private and counselor-only assessment items, homework drafts, and individual reflections are not shown to your partner. Only explicitly shared items unlock after both partners submit.",
  },
  {
    id: "after",
    title: "What happens after eight sessions?",
    body: "Your counselor and Senior Pastor guide final readiness as a pastoral decision — not an automatic certificate. Some couples continue enrichment or celebration modules afterward.",
  },
  {
    id: "limits",
    title: "Important limits",
    body: "This program supports church-based premarital preparation. It is not emergency care. Authorized leaders may act when safety, legal duty, or pastoral care requires — we do not promise absolute secrecy in those cases.",
  },
];

export function MarriageCoupleHelpSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className={`${marriagePremium.card} mt-6`} aria-labelledby="couple-help-heading">
      <h2 id="couple-help-heading" className={marriagePremium.sectionLabel}>
        Help & guidance
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>Plain answers about privacy, homework, and counseling.</p>
      <ul className="mt-4 space-y-2">
        {topics.map((topic) => {
          const open = openId === topic.id;
          return (
            <li key={topic.id} className="rounded-xl border border-stone-200 dark:border-white/10">
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : topic.id)}
              >
                {topic.title}
                <span className="text-clay-700 dark:text-clay-300" aria-hidden>
                  {open ? "−" : "+"}
                </span>
              </button>
              {open ? (
                <p className="border-t border-stone-100 px-3 pb-3 pt-2 text-sm text-night-700 dark:border-white/5 dark:text-sand-300">
                  {topic.body}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
