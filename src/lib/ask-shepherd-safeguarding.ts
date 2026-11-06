export type SafeguardingLevel = "none" | "caution" | "critical";

const CRITICAL_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill\s+(myself|herself|himself)\b/i,
  /\bself[- ]harm\b/i,
  /\bchild\s+(abuse|molestation)\b/i,
  /\bsexual\s+assault\b/i,
  /\brape\b/i,
  /\bdomestic\s+violence\b/i,
  /\bthreat(en|s)?\s+to\s+kill\b/i,
];

const CAUTION_PATTERNS: RegExp[] = [
  /\babuse\b/i,
  /\bexploit(ed|ation)?\b/i,
  /\bminor\b.*\b(alone|secret)\b/i,
  /\bgrooming\b/i,
  /\bharassment\b/i,
];

export function assessSafeguardingSignals(text: string): {
  level: SafeguardingLevel;
  matchedTerms: string[];
} {
  const t = text.slice(0, 8000);
  const matched: string[] = [];
  for (const p of CRITICAL_PATTERNS) {
    if (p.test(t)) matched.push(p.source.slice(0, 40));
  }
  if (matched.length > 0) {
    return { level: "critical", matchedTerms: matched };
  }
  const caution: string[] = [];
  for (const p of CAUTION_PATTERNS) {
    if (p.test(t)) caution.push(p.source.slice(0, 40));
  }
  if (caution.length > 0) {
    return { level: "caution", matchedTerms: caution };
  }
  return { level: "none", matchedTerms: [] };
}

export const SAFEGUARDING_CRITICAL_NOTICE =
  "**Immediate safety:** If anyone is at risk of harm, prioritize safety now. Contact local emergency services when there is imminent danger. " +
  "Do not rely on this tool for abuse, violence, or safeguarding investigations — involve designated church safeguarding leaders and follow applicable reporting rules. " +
  "This assistant cannot replace licensed professionals where mental health or legal issues require them.";
