import { Capacitor } from "@capacitor/core";

export type VolunteerLocationFailure =
  | "unsupported"
  | "permission_denied"
  | "unavailable"
  | "timeout";

export class VolunteerLocationError extends Error {
  readonly reason: VolunteerLocationFailure;

  constructor(reason: VolunteerLocationFailure) {
    super(reason);
    this.reason = reason;
  }
}

function mapBrowserError(error: GeolocationPositionError): VolunteerLocationFailure {
  if (error.code === error.PERMISSION_DENIED) return "permission_denied";
  if (error.code === error.TIMEOUT) return "timeout";
  return "unavailable";
}

function getBrowserPosition(options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new VolunteerLocationError("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new VolunteerLocationError(mapBrowserError(error)));
    }, options);
  });
}

async function getNativePosition() {
  const { Geolocation } = await import("@capacitor/geolocation");
  let permission = await Geolocation.checkPermissions();

  if (permission.location === "prompt" || permission.location === "prompt-with-rationale") {
    permission = await Geolocation.requestPermissions();
  }

  if (permission.location === "denied") {
    throw new VolunteerLocationError("permission_denied");
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

export async function getVolunteerLocation() {
  if (Capacitor.isNativePlatform()) {
    try {
      return await getNativePosition();
    } catch (error) {
      if (error instanceof VolunteerLocationError) {
        throw error;
      }
      throw new VolunteerLocationError("unavailable");
    }
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 },
  ];

  let lastError: VolunteerLocationError | null = null;
  for (const options of attempts) {
    try {
      const position = await getBrowserPosition(options);
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      lastError =
        error instanceof VolunteerLocationError
          ? error
          : new VolunteerLocationError("unavailable");
    }
  }

  throw lastError ?? new VolunteerLocationError("unavailable");
}

export function volunteerLocationErrorMessage(reason: VolunteerLocationFailure) {
  switch (reason) {
    case "unsupported":
      return "Location is not supported on this device.";
    case "permission_denied":
      return "Location access is blocked. Allow location for Shana City in your phone or browser settings, then tap I'm here again.";
    case "timeout":
      return "Finding your location took too long. Move near a window or step outside briefly, then try again.";
    case "unavailable":
      return "Could not read your location. Turn on Location Services and try again.";
  }
}
