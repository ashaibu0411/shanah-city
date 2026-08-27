import { createPrivateKey, sign } from "node:crypto";
import { connect } from "node:http2";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { StoredNativePushToken } from "@/lib/stores/push-json";
import { getPushIconUrl } from "@/lib/push-branding";

export type NativePushPayload = {
  title: string;
  body: string;
  url: string;
  icon?: string;
};

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const candidates = [raw];
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      candidates.push(JSON.parse(raw) as string);
    } catch {
      // Keep the original string.
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        };
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

export function isAndroidNativePushConfigured() {
  return Boolean(parseServiceAccount());
}

export function isIosNativePushConfigured() {
  return Boolean(
    process.env.APNS_KEY_P8?.trim() &&
      process.env.APNS_KEY_ID?.trim() &&
      process.env.APNS_TEAM_ID?.trim(),
  );
}

export function isNativePushConfigured() {
  return isAndroidNativePushConfigured() || isIosNativePushConfigured();
}

function firebaseMessaging() {
  const account = parseServiceAccount();
  if (!account) return null;
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getMessaging();
}

let apnsJwtCache: { token: string; exp: number } | null = null;

function apnsJwt() {
  const keyPem = process.env.APNS_KEY_P8!.replace(/\\n/g, "\n");
  const keyId = process.env.APNS_KEY_ID!.trim();
  const teamId = process.env.APNS_TEAM_ID!.trim();
  const now = Math.floor(Date.now() / 1000);
  if (apnsJwtCache && apnsJwtCache.exp - 60 > now) {
    return apnsJwtCache.token;
  }

  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "ES256", kid: keyId })}.${encode({
    iss: teamId,
    iat: now,
  })}`;
  const signature = sign("SHA256", Buffer.from(unsigned), {
    key: createPrivateKey(keyPem),
    dsaEncoding: "ieee-p1363",
  });
  const token = `${unsigned}.${signature.toString("base64url")}`;
  apnsJwtCache = { token, exp: now + 50 * 60 };
  return token;
}

function sendApns(
  token: string,
  payload: NativePushPayload,
  production = process.env.APNS_PRODUCTION !== "false",
) {
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || "org.shanahcity.app";
  const host = production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const jwt = apnsJwt();
  const body = JSON.stringify({
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: "default",
    },
    url: payload.url,
  });

  return new Promise<void>((resolve, reject) => {
    const client = connect(`https://${host}`);
    const fail = (error: unknown) => {
      try {
        client.close();
      } catch {
        // Already closed.
      }
      reject(error);
    };
    client.on("error", fail);
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });
    let response = "";
    let status = 0;
    request.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      response += chunk;
    });
    request.on("end", () => {
      client.close();
      if (status >= 200 && status < 300) {
        resolve();
        return;
      }
      const error = new Error(response || `APNs status ${status}`) as Error & {
        status: number;
      };
      error.status = status;
      reject(error);
    });
    request.end(body);
  });
}

function isApnsEnvironmentMismatch(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | undefined)?.status;
  return (
    status === 400 ||
    status === 410 ||
    /BadDeviceToken|DeviceTokenNotForTopic|Unregistered|InvalidProviderToken/i.test(
      message,
    )
  );
}

async function sendApnsWithFallback(token: string, payload: NativePushPayload) {
  const preferredProduction = process.env.APNS_PRODUCTION !== "false";
  try {
    await sendApns(token, payload, preferredProduction);
    return;
  } catch (error) {
    if (!isApnsEnvironmentMismatch(error)) {
      throw error;
    }
    await sendApns(token, payload, !preferredProduction);
  }
}

export async function sendNativePush(
  record: StoredNativePushToken,
  payload: NativePushPayload,
) {
  if (record.platform === "android") {
    const messaging = firebaseMessaging();
    if (!messaging) {
      throw new Error("Firebase is not configured.");
    }
    await messaging.send({
      token: record.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon ?? getPushIconUrl(),
      },
      data: {
        url: payload.url,
        title: payload.title,
        body: payload.body,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          icon: "ic_stat_shanah",
          imageUrl: payload.icon ?? getPushIconUrl(),
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: "default",
          },
          url: payload.url,
        },
        fcmOptions: {
          imageUrl: payload.icon ?? getPushIconUrl(),
        },
      },
    });
    return;
  }

  if (!isIosNativePushConfigured()) {
    throw new Error("APNs is not configured.");
  }
  await sendApnsWithFallback(record.token, payload);
}

export function shouldDropNativeToken(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | undefined)?.status;
  return (
    status === 410 ||
    /registration-token-not-registered|invalid-registration-token|Unregistered|BadDeviceToken|ExpiredProviderToken/i.test(
      message,
    )
  );
}
