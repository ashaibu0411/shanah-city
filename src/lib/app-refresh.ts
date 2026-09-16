export const APP_REFRESH_EVENT = "shanah-app-refresh";

export function dispatchAppRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APP_REFRESH_EVENT));
}

export function subscribeAppRefresh(handler: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(APP_REFRESH_EVENT, handler);
  return () => window.removeEventListener(APP_REFRESH_EVENT, handler);
}

type RefreshHandler = () => void | Promise<void>;

let runRefreshHandler: RefreshHandler | null = null;

export function registerAppRefreshRunner(handler: RefreshHandler | null) {
  runRefreshHandler = handler;
}

export async function runAppRefresh() {
  if (!runRefreshHandler) return;
  await runRefreshHandler();
}
