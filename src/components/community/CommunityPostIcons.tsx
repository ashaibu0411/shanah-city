export function IgHeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.75}>
      {filled ? (
        <path d="M11.645 20.91 2.25 11.525a5.803 5.803 0 0 1 0-8.196 5.803 5.803 0 0 1 8.196 0L12 4.883l1.554-1.554a5.803 5.803 0 0 1 8.196 8.196l-9.395 9.385Z" />
      ) : (
        <path d="M16.5 3.75c-1.74 0-3.41.81-4.5 2.09-1.09-1.28-2.76-2.09-4.5-2.09-3.03 0-5.5 2.47-5.5 5.5 0 6.75 10 11.25 10 11.25s10-4.5 10-11.25c0-3.03-2.47-5.5-5.5-5.5Z" />
      )}
    </svg>
  );
}

export function IgCommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-none stroke-current" strokeWidth={1.75}>
      <path d="M12 20.25c4.97 0 9-3.694 9-8.25S16.97 3.75 12 3.75 3 7.444 3 12c0 2.104.859 4.023 2.273 5.484L4.5 20.25l3.75-.75Z" />
    </svg>
  );
}

export function IgShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-none stroke-current" strokeWidth={1.75}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9l20-7Z" />
    </svg>
  );
}

export function IgSmileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-none stroke-current" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </svg>
  );
}
