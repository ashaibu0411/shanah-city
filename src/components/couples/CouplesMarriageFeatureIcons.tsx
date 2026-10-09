import type { CouplesMarriageFeatureVariant } from "@/lib/couples-marriage-dashboard-config";

const iconClass = "h-7 w-7";

export function CouplesMarriageFeatureIcon({ variant }: { variant: CouplesMarriageFeatureVariant }) {
  switch (variant) {
    case "calendar":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="#2563EB" strokeWidth="1.75" />
          <path d="M8 3v4M16 3v4M4 10h16" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "date-night":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 20.5c4.2-3.1 7-6.4 7-10a4.5 4.5 0 0 0-9-2.2A4.5 4.5 0 0 0 5 10.5c0 3.6 2.8 6.9 7 10Z"
            stroke="#B91C1C"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "love-notes":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="#DB2777" strokeWidth="1.75" />
          <path d="M4 9l8 5 8-5" stroke="#DB2777" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case "check-in":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="#1D4ED8" strokeWidth="1.75" />
          <path d="M9 10h6M9 14h4" stroke="#1D4ED8" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M8.5 8.5l1.2 1.2 2.8-2.8" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "prayer":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 10V8a4 4 0 1 1 8 0v2M7 10h10v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9Z"
            stroke="#B78B54"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M10 14c.8 1.2 2.2 2 4 2s3.2-.8 4-2" stroke="#B78B54" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "goals":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="7" stroke="#D97706" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="3.5" stroke="#D97706" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="1" fill="#D97706" />
        </svg>
      );
    case "devotionals":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 5h11a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2V5Z" stroke="#0D9488" strokeWidth="1.75" />
          <path d="M8 5v14h11" stroke="#0D9488" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case "games":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 14h2v2H8v2H6v-2H4v-2h2v-2h2v2Zm11-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM16.5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
            stroke="#7C3AED"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <rect x="3" y="9" width="18" height="9" rx="3" stroke="#7C3AED" strokeWidth="1.75" />
        </svg>
      );
    default:
      return null;
  }
}
