import webpush from "web-push";
import { getVapidPublicKey, isPushConfigured } from "../src/lib/push-server";

let webPushRuntimeReady = false;
const subject = process.env.VAPID_SUBJECT?.trim();
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
if (subject && publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    webPushRuntimeReady = true;
  } catch {
    webPushRuntimeReady = false;
  }
}

console.log(
  JSON.stringify({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
    webPushRuntimeReady,
  }),
);
