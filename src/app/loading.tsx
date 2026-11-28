export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[35vh] items-center justify-center">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-current border-r-transparent opacity-60" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
