"use client";

import { isNativeAppPlatform } from "@/lib/native-app";

/** Keychain / Keystore namespace for stored member credentials. */
export const BIOMETRIC_LOGIN_SERVER = "org.shanahcity.app";

export type BiometricLoginKind =
  | "faceId"
  | "touchId"
  | "fingerprint"
  | "faceUnlock"
  | "biometrics";

export type BiometricLoginAvailability = {
  supported: boolean;
  kind: BiometricLoginKind;
  label: string;
  shortLabel: string;
};

function labelForKind(kind: BiometricLoginKind) {
  switch (kind) {
    case "faceId":
      return { label: "Face ID", shortLabel: "Face ID" };
    case "touchId":
      return { label: "Touch ID", shortLabel: "Touch ID" };
    case "fingerprint":
      return { label: "Fingerprint", shortLabel: "fingerprint" };
    case "faceUnlock":
      return { label: "Face unlock", shortLabel: "face unlock" };
    default:
      return { label: "Biometrics", shortLabel: "biometrics" };
  }
}

/** Mirrors @capgo/capacitor-native-biometric BiometryType for display labels only. */
const BIOMETRY_TYPE = {
  TOUCH_ID: 1,
  FACE_ID: 2,
  FINGERPRINT: 3,
  FACE_AUTHENTICATION: 4,
} as const;

function kindFromBiometryType(biometryType: number): BiometricLoginKind {
  switch (biometryType) {
    case BIOMETRY_TYPE.FACE_ID:
      return "faceId";
    case BIOMETRY_TYPE.TOUCH_ID:
      return "touchId";
    case BIOMETRY_TYPE.FINGERPRINT:
      return "fingerprint";
    case BIOMETRY_TYPE.FACE_AUTHENTICATION:
      return "faceUnlock";
    default:
      return "biometrics";
  }
}

async function loadNativeBiometric() {
  if (!isNativeAppPlatform()) return null;
  const mod = await import("@capgo/capacitor-native-biometric");
  return mod;
}

export async function getBiometricLoginAvailability(): Promise<BiometricLoginAvailability> {
  const fallback: BiometricLoginAvailability = {
    supported: false,
    kind: "biometrics",
    ...labelForKind("biometrics"),
  };

  if (!isNativeAppPlatform()) return fallback;

  try {
    const mod = await loadNativeBiometric();
    if (!mod) return fallback;

    const result = await mod.NativeBiometric.isAvailable({ useFallback: false });
    if (!result.isAvailable || !result.strongBiometryIsAvailable) {
      return fallback;
    }

    const kind = kindFromBiometryType(result.biometryType);
    return {
      supported: true,
      kind,
      ...labelForKind(kind),
    };
  } catch {
    return fallback;
  }
}

export async function hasBiometricLoginSaved(): Promise<boolean> {
  if (!isNativeAppPlatform()) return false;

  try {
    const mod = await loadNativeBiometric();
    if (!mod) return false;

    const { isSaved } = await mod.NativeBiometric.isCredentialsSaved({
      server: BIOMETRIC_LOGIN_SERVER,
    });
    return isSaved;
  } catch {
    return false;
  }
}

export async function enableBiometricLogin(email: string, password: string): Promise<void> {
  if (!isNativeAppPlatform()) return;

  const mod = await loadNativeBiometric();
  if (!mod) return;

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) return;

  await mod.NativeBiometric.setCredentials({
    username: trimmedEmail,
    password,
    server: BIOMETRIC_LOGIN_SERVER,
    accessControl: mod.AccessControl.BIOMETRY_ANY,
    title: "Save sign-in",
    negativeButtonText: "Cancel",
  });
}

export async function readBiometricLoginCredentials(): Promise<{ email: string; password: string }> {
  const mod = await loadNativeBiometric();
  if (!mod) {
    throw new Error("Biometric login is only available in the mobile app.");
  }

  const credentials = await mod.NativeBiometric.getSecureCredentials({
    server: BIOMETRIC_LOGIN_SERVER,
    reason: "Sign in to Shana City",
    title: "Sign in",
    subtitle: "Use biometrics to sign in",
    description: "Confirm your identity to continue",
    negativeButtonText: "Use password",
  });

  return {
    email: credentials.username.trim(),
    password: credentials.password,
  };
}

export async function clearBiometricLogin(): Promise<void> {
  if (!isNativeAppPlatform()) return;

  try {
    const mod = await loadNativeBiometric();
    if (!mod) return;

    await mod.NativeBiometric.deleteCredentials({ server: BIOMETRIC_LOGIN_SERVER });
  } catch {
    // Already cleared or never saved.
  }
}

export function isBiometricUserCancel(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string | number }).code;
  if (code === 16 || code === "16") return true;
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return message.includes("cancel") || message.includes("user cancel");
}
