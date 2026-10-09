/** Inline SVG icons for Power Couples home (white on gradient cards). */

export function CouplesHomeLockHeartIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 15.5c-.8-.9-2.2-.6-2.5.4-.4 1.2 1.1 2.4 2.5 3.4 1.4-1 2.9-2.2 2.5-3.4-.3-1-1.7-1.3-2.5-.4Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CouplesHomeGroupIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13.5 19c0-2 1.5-3.8 3.5-4.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CouplesHomeArrowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
