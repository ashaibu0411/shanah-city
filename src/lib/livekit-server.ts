import { AccessToken } from "livekit-server-sdk";
import { getLiveKitPublicUrl, isLiveKitConfigured } from "@/lib/livekit-config";

export { getLiveKitPublicUrl, isLiveKitConfigured };

export type LiveKitParticipantRole = "host" | "viewer";

export function createStoryLiveRoomName(authorId: string) {
  const safe = authorId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return `story-live-${safe}-${Date.now()}`;
}

export async function createLiveKitRoomToken(input: {
  roomName: string;
  identity: string;
  name: string;
  role: LiveKitParticipantRole;
}) {
  if (!isLiveKitConfigured()) {
    throw new Error("Live streaming is not configured yet.");
  }

  const apiKey = process.env.LIVEKIT_API_KEY!.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET!.trim();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: input.identity,
    name: input.name,
    ttl: 60 * 60 * 4,
  });

  const canPublish = input.role === "host";
  token.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: canPublish,
  });

  return token.toJwt();
}
