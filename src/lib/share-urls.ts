export function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://shanah-city.vercel.app";
}

export function devotionShareUrl(devotionId: string) {
  return `${getAppBaseUrl()}/devotions?id=${encodeURIComponent(devotionId)}`;
}

export function devotionViewUrl(devotionId: string) {
  return devotionShareUrl(devotionId);
}

export function eventShareUrl(eventId: string) {
  return `${getAppBaseUrl()}/calendar?event=${encodeURIComponent(eventId)}`;
}

export function eventViewUrl(eventId: string) {
  return eventShareUrl(eventId);
}

export function urgentAlertShareUrl(alertId?: string) {
  if (alertId) {
    return `${getAppBaseUrl()}/?alert=${encodeURIComponent(alertId)}`;
  }
  return `${getAppBaseUrl()}/`;
}

export function urgentAlertViewUrl(alertId?: string) {
  return urgentAlertShareUrl(alertId);
}
