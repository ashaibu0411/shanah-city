import Link from "next/link";

type ChoirGroupHeaderProps = {
  onChatClick: () => void;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M11.78 4.22a.75.75 0 0 1 0 1.06L8.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6A2.5 2.5 0 0 1 14.5 13H8l-3.5 3v-3H5.5A2.5 2.5 0 0 1 3 10.5v-6Z"
      />
    </svg>
  );
}

export function ChoirGroupHeader({ onChatClick }: ChoirGroupHeaderProps) {
  return (
    <header className="choir-group-header">
      <Link href="/groups" className="choir-header-icon-btn" aria-label="Back to groups">
        <BackIcon />
      </Link>
      <div className="min-w-0 flex-1 px-2 text-center">
        <h1 className="font-display text-base font-semibold tracking-tight text-[var(--choir-heading)] sm:text-[17px]">
          Shanah Worship
        </h1>
        <p className="text-[11px] font-medium text-[var(--choir-muted)]">Worship team &amp; choir</p>
      </div>
      <button type="button" onClick={onChatClick} className="choir-header-icon-btn" aria-label="Open team chat">
        <ChatIcon />
      </button>
    </header>
  );
}
