type MobileTabIconProps = {
  name: "home" | "live" | "devotions" | "messages" | "more";
  className?: string;
};

export function MobileTabIcon({ name, className = "h-5 w-5" }: MobileTabIconProps) {
  const shared = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...shared}>
          <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
        </svg>
      );
    case "live":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <path d="M9.2 9.2a5 5 0 0 0 0 5.6M14.8 9.2a5 5 0 0 1 0 5.6" />
          <path d="M6.8 6.8a9 9 0 0 0 0 10.4M17.2 6.8a9 9 0 0 1 0 10.4" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...shared}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
        </svg>
      );
    case "messages":
      return (
        <svg {...shared}>
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 16 0Z" />
        </svg>
      );
    case "more":
      return (
        <svg {...shared}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function navHrefToTabIcon(href: string): MobileTabIconProps["name"] | null {
  switch (href) {
    case "/":
      return "home";
    case "/live":
      return "live";
    case "/devotions":
      return "devotions";
    case "/messages":
      return "messages";
    default:
      return null;
  }
}
