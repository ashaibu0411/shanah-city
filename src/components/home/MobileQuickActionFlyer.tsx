type QuickActionFlyerName = "give" | "connect" | "community" | "devotions";

type MobileQuickActionFlyerProps = {
  name: QuickActionFlyerName;
  className?: string;
};

function FlyerFrame() {
  return (
    <>
      <rect x="14" y="14" width="372" height="472" rx="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <rect x="22" y="22" width="356" height="456" rx="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </>
  );
}

export function MobileQuickActionFlyer({
  name,
  className = "h-full w-full",
}: MobileQuickActionFlyerProps) {
  const id = name;
  const shared = {
    className,
    viewBox: "0 0 400 500",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    preserveAspectRatio: "xMidYMid slice",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "give":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#120a04" />
              <stop offset="0.35" stopColor="#3d2208" />
              <stop offset="0.72" stopColor="#7a4512" />
              <stop offset="1" stopColor="#c98a2e" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="0" cy="0" r="1" gradientTransform="translate(200 180) scale(220 180)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffe7a8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffe7a8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-gold`} x1="120" y1="80" x2="280" y2="320" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff4cc" />
              <stop offset="0.35" stopColor="#f0c35a" />
              <stop offset="0.7" stopColor="#c9851f" />
              <stop offset="1" stopColor="#7a4a0d" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
            </filter>
            <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#fff" fillOpacity="0.08" />
            </pattern>
          </defs>
          <rect width="400" height="500" fill={`url(#${id}-sky)`} />
          <rect width="400" height="500" fill={`url(#${id}-dots)`} />
          <ellipse cx="200" cy="170" rx="170" ry="130" fill={`url(#${id}-glow)`} />
          <FlyerFrame />
          <path d="M48 88h88l12 18 12-18h88" stroke="#f5d78e" strokeOpacity="0.45" strokeWidth="2" />
          <text x="200" y="108" textAnchor="middle" fill="#f8e7c0" fontSize="13" fontWeight="700" letterSpacing="6" fontFamily="Georgia, serif">
            GENEROSITY
          </text>
          <g filter={`url(#${id}-shadow)`}>
            <path
              d="M200 150c-34 0-62 26-62 58 0 44 62 98 62 98s62-54 62-98c0-32-28-58-62-58Z"
              fill={`url(#${id}-gold)`}
            />
            <path
              d="M200 168c-24 0-43 19-43 42 0 32 43 72 43 72s43-40 43-72c0-23-19-42-43-42Z"
              fill="#fff"
              fillOpacity="0.18"
            />
          </g>
          <ellipse cx="200" cy="318" rx="92" ry="18" fill="#000" fillOpacity="0.28" />
          <path
            d="M128 300c0-18 14-32 32-32h80c18 0 32 14 32 32v24H128v-24Z"
            fill="#1a1208"
            fillOpacity="0.55"
          />
          <rect x="152" y="286" width="96" height="34" rx="8" fill="#fff" fillOpacity="0.95" />
          <text x="200" y="309" textAnchor="middle" fill="#7a4512" fontSize="22" fontWeight="800" fontFamily="system-ui, sans-serif">
            $
          </text>
          <text x="200" y="392" textAnchor="middle" fill="#fff8e8" fontSize="46" fontWeight="700" letterSpacing="2" fontFamily="Georgia, serif" filter={`url(#${id}-shadow)`}>
            Give
          </text>
          <text x="200" y="424" textAnchor="middle" fill="#f0d9a8" fontSize="14" fontWeight="600" letterSpacing="3" fontFamily="system-ui, sans-serif">
            SUPPORT THE MISSION
          </text>
          <path d="M118 448h164" stroke="#f5d78e" strokeOpacity="0.35" strokeWidth="1.5" />
        </svg>
      );
    case "connect":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#071428" />
              <stop offset="0.4" stopColor="#123a7a" />
              <stop offset="0.75" stopColor="#1d4ed8" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
            <radialGradient id={`${id}-burst`} cx="0" cy="0" r="1" gradientTransform="translate(200 210) scale(200 160)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c4ddff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#c4ddff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-person-a`} x1="90" y1="120" x2="150" y2="260" gradientUnits="userSpaceOnUse">
              <stop stopColor="#dbeafe" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id={`${id}-person-b`} x1="250" y1="120" x2="310" y2="260" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e9d5ff" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id={`${id}-person-c`} x1="170" y1="180" x2="230" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde68a" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>
          <rect width="400" height="500" fill={`url(#${id}-bg)`} />
          <rect width="400" height="500" fill={`url(#${id}-burst)`} />
          <FlyerFrame />
          <text x="200" y="108" textAnchor="middle" fill="#dbeafe" fontSize="13" fontWeight="700" letterSpacing="6" fontFamily="Georgia, serif">
            WELCOME HOME
          </text>
          <g filter={`url(#${id}-shadow)`}>
            <circle cx="120" cy="190" r="42" fill={`url(#${id}-person-a)`} />
            <circle cx="280" cy="190" r="42" fill={`url(#${id}-person-b)`} />
            <circle cx="200" cy="248" r="48" fill={`url(#${id}-person-c)`} />
          </g>
          <path d="M152 176c16 10 24 14 48 14s32-4 48-14" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
          <path d="M152 262c16-10 24-14 48-14s32 4 48 14" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
          <circle cx="120" cy="190" r="10" fill="#fff" fillOpacity="0.85" />
          <circle cx="280" cy="190" r="10" fill="#fff" fillOpacity="0.85" />
          <circle cx="200" cy="248" r="11" fill="#fff" fillOpacity="0.9" />
          <path d="M88 320h224" stroke="#93c5fd" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="6 8" />
          <text x="200" y="392" textAnchor="middle" fill="#ffffff" fontSize="44" fontWeight="700" letterSpacing="1" fontFamily="Georgia, serif" filter={`url(#${id}-shadow)`}>
            Connect
          </text>
          <text x="200" y="424" textAnchor="middle" fill="#bfdbfe" fontSize="14" fontWeight="600" letterSpacing="3" fontFamily="system-ui, sans-serif">
            FIND YOUR PLACE
          </text>
          <rect x="132" y="442" width="136" height="28" rx="14" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeOpacity="0.25" />
          <text x="200" y="461" textAnchor="middle" fill="#eff6ff" fontSize="12" fontWeight="700" letterSpacing="2" fontFamily="system-ui, sans-serif">
            PLAN A VISIT
          </text>
        </svg>
      );
    case "community":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#042f2e" />
              <stop offset="0.45" stopColor="#0f766e" />
              <stop offset="0.8" stopColor="#14b8a6" />
              <stop offset="1" stopColor="#5eead4" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="0" cy="0" r="1" gradientTransform="translate(200 200) scale(190 150)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ecfdf5" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ecfdf5" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-bubble`} x1="110" y1="130" x2="290" y2="310" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#99f6e4" />
            </linearGradient>
            <linearGradient id={`${id}-heart`} x1="250" y1="120" x2="310" y2="190" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fecdd3" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.38" />
            </filter>
          </defs>
          <rect width="400" height="500" fill={`url(#${id}-bg)`} />
          <rect width="400" height="500" fill={`url(#${id}-glow)`} />
          <FlyerFrame />
          <text x="200" y="108" textAnchor="middle" fill="#ccfbf1" fontSize="13" fontWeight="700" letterSpacing="6" fontFamily="Georgia, serif">
            TOGETHER
          </text>
          <g filter={`url(#${id}-shadow)`}>
            <path
              d="M88 170c0-28 22-50 50-50h124c28 0 50 22 50 50v72c0 28-22 50-50 50H138c-28 0-50-22-50-50v-72Z"
              fill={`url(#${id}-bubble)`}
            />
            <path d="M118 206h164M118 236h118M118 266h142" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.55" />
            <path
              d="M268 148c10 0 18 8 18 18 0 15-18 30-18 30s-18-15-18-30c0-10 8-18 18-18Z"
              fill={`url(#${id}-heart)`}
            />
          </g>
          <g opacity="0.9">
            <circle cx="98" cy="318" r="22" fill="#134e4a" stroke="#99f6e4" strokeWidth="2" />
            <circle cx="148" cy="336" r="18" fill="#115e59" stroke="#99f6e4" strokeWidth="2" />
            <circle cx="252" cy="336" r="18" fill="#115e59" stroke="#99f6e4" strokeWidth="2" />
            <circle cx="302" cy="318" r="22" fill="#134e4a" stroke="#99f6e4" strokeWidth="2" />
            <circle cx="200" cy="348" r="24" fill="#0f766e" stroke="#ccfbf1" strokeWidth="2.5" />
          </g>
          <text x="200" y="392" textAnchor="middle" fill="#ffffff" fontSize="40" fontWeight="700" letterSpacing="1" fontFamily="Georgia, serif" filter={`url(#${id}-shadow)`}>
            Community
          </text>
          <text x="200" y="424" textAnchor="middle" fill="#ccfbf1" fontSize="14" fontWeight="600" letterSpacing="3" fontFamily="system-ui, sans-serif">
            PRAY · SHARE · GROW
          </text>
          <path d="M126 448h148" stroke="#99f6e4" strokeOpacity="0.35" strokeWidth="1.5" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...shared}>
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1c0f05" />
              <stop offset="0.35" stopColor="#7c2d12" />
              <stop offset="0.7" stopColor="#ea580c" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
            <radialGradient id={`${id}-sun`} cx="0" cy="0" r="1" gradientTransform="translate(200 150) scale(160 120)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff7d6" stopOpacity="0.95" />
              <stop offset="0.55" stopColor="#fde68a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-book`} x1="120" y1="170" x2="280" y2="360" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff7d6" />
              <stop offset="0.4" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id={`${id}-page`} x1="160" y1="210" x2="240" y2="330" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#f3efe8" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.42" />
            </filter>
          </defs>
          <rect width="400" height="500" fill={`url(#${id}-bg)`} />
          <rect width="400" height="500" fill={`url(#${id}-sun)`} />
          <FlyerFrame />
          <path d="M200 72v34M168 82l16 28M232 82l-16 28" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
          <text x="200" y="108" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="700" letterSpacing="6" fontFamily="Georgia, serif">
            DAILY WORD
          </text>
          <g filter={`url(#${id}-shadow)`}>
            <path d="M118 188h72a8 8 0 0 1 8 8v112a8 8 0 0 1-8 8h-72V188Z" fill={`url(#${id}-book)`} />
            <path d="M282 188h-72a8 8 0 0 0-8 8v112a8 8 0 0 0 8 8h72V188Z" fill={`url(#${id}-book)`} opacity="0.94" />
            <rect x="156" y="214" width="88" height="108" rx="4" fill={`url(#${id}-page)`} />
            <path d="M168 238h64M168 262h64M168 286h42" stroke="#b08f66" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
            <path d="M200 188v132" stroke="#7c2d12" strokeWidth="2" opacity="0.35" />
          </g>
          <ellipse cx="200" cy="340" rx="88" ry="14" fill="#000" fillOpacity="0.22" />
          <text x="200" y="392" textAnchor="middle" fill="#fff8eb" fontSize="40" fontWeight="700" letterSpacing="1" fontFamily="Georgia, serif" filter={`url(#${id}-shadow)`}>
            Devotions
          </text>
          <text x="200" y="424" textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="600" letterSpacing="3" fontFamily="system-ui, sans-serif">
            READ · LISTEN · REFLECT
          </text>
          <rect x="126" y="442" width="148" height="28" rx="14" fill="#fff" fillOpacity="0.12" stroke="#fde68a" strokeOpacity="0.35" />
          <text x="200" y="461" textAnchor="middle" fill="#fff7ed" fontSize="12" fontWeight="700" letterSpacing="2" fontFamily="system-ui, sans-serif">
            TODAY&apos;S READING
          </text>
        </svg>
      );
  }
}
