type QuickActionIconName = "give" | "connect" | "community" | "devotions";

type MobileQuickActionIconProps = {
  name: QuickActionIconName;
  className?: string;
};

export function MobileQuickActionIcon({
  name,
  className = "h-full w-full",
}: MobileQuickActionIconProps) {
  const id = name;
  const shared = {
    className,
    viewBox: "0 0 80 80",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "give":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-bg`} x1="8" y1="8" x2="72" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f5d78e" />
              <stop offset="0.45" stopColor="#d4a24f" />
              <stop offset="1" stopColor="#8b5a1f" />
            </linearGradient>
            <linearGradient id={`${id}-shine`} x1="20" y1="12" x2="56" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="0" cy="0" r="1" gradientTransform="translate(40 42) scale(28)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff7d6" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="30" fill={`url(#${id}-glow)`} />
          <path
            d="M40 18c-7.2 0-13 5.8-13 13 0 9.8 13 22 13 22s13-12.2 13-22c0-7.2-5.8-13-13-13Z"
            fill={`url(#${id}-bg)`}
          />
          <path
            d="M40 22c-5 0-9 4-9 9 0 7.4 9 17 9 17s9-9.6 9-17c0-5-4-9-9-9Z"
            fill={`url(#${id}-shine)`}
            opacity="0.45"
          />
          <path
            d="M33 46h14c2.2 0 4 1.8 4 4v1H29v-1c0-2.2 1.8-4 4-4Z"
            fill="#fff"
            fillOpacity="0.92"
          />
          <text x="40" y="51.5" textAnchor="middle" fill="#8b5a1f" fontSize="9" fontWeight="700" fontFamily="system-ui, sans-serif">
            $
          </text>
        </svg>
      );
    case "connect":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-a`} x1="14" y1="18" x2="34" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9ed8ff" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id={`${id}-b`} x1="46" y1="18" x2="66" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c4b5fd" />
              <stop offset="1" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id={`${id}-c`} x1="30" y1="34" x2="50" y2="62" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde68a" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M24 24a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z" fill={`url(#${id}-a)`} />
          <path d="M56 24a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z" fill={`url(#${id}-b)`} />
          <path d="M40 38a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" fill={`url(#${id}-c)`} />
          <path d="M30 30c4 2 6 4 10 4s6-2 10-4" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 50c4-2 6-4 10-4s6 2 10 4" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="24" r="3.5" fill="#fff" fillOpacity="0.9" />
          <circle cx="56" cy="24" r="3.5" fill="#fff" fillOpacity="0.9" />
          <circle cx="40" cy="47" r="3.5" fill="#fff" fillOpacity="0.9" />
        </svg>
      );
    case "community":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-bubble`} x1="18" y1="20" x2="62" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#86efac" />
              <stop offset="0.5" stopColor="#14b8a6" />
              <stop offset="1" stopColor="#0f766e" />
            </linearGradient>
            <linearGradient id={`${id}-heart`} x1="44" y1="24" x2="62" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fda4af" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <path
            d="M18 24c0-6.6 5.4-12 12-12h20c6.6 0 12 5.4 12 12v10c0 6.6-5.4 12-12 12H30c-6.6 0-12-5.4-12-12V24Z"
            fill={`url(#${id}-bubble)`}
          />
          <path
            d="M26 30h28M26 38h20M26 46h24"
            stroke="#fff"
            strokeOpacity="0.82"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M54 24c2.8 0 5 2.2 5 5 0 4.2-5 8.5-5 8.5S49 33.2 49 29c0-2.8 2.2-5 5-5Z"
            fill={`url(#${id}-heart)`}
          />
          <circle cx="24" cy="20" r="4" fill="#fff" fillOpacity="0.35" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-book`} x1="22" y1="16" x2="58" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde68a" />
              <stop offset="0.45" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id={`${id}-page`} x1="30" y1="22" x2="54" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#f3efe8" />
            </linearGradient>
            <radialGradient id={`${id}-rays`} cx="0" cy="0" r="1" gradientTransform="translate(40 18) scale(24 18)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff7d6" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M40 10v8" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 12l4 7M48 12l-4 7" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="40" cy="16" rx="18" ry="10" fill={`url(#${id}-rays)`} />
          <path d="M22 24h16a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H22V24Z" fill={`url(#${id}-book)`} />
          <path d="M58 24H42a4 4 0 0 0-4 4v30a4 4 0 0 0 4 4h16V24Z" fill={`url(#${id}-book)`} opacity="0.92" />
          <rect x="30" y="30" width="20" height="28" rx="2" fill={`url(#${id}-page)`} />
          <path d="M34 36h12M34 42h12M34 48h8" stroke="#b08f66" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
          <path d="M40 24v38" stroke="#8b5a1f" strokeWidth="1.5" opacity="0.45" />
        </svg>
      );
  }
}
