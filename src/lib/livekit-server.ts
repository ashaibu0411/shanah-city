import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { getLiveKitApiHost, getLiveKitPublicUrl, isLiveKitConfigured } from "@/lib/livekit-config";

export { getLiveKitPublicUrl, isLiveKitConfigured };

export type LiveKitParticipantRole = "host" | "viewer" | "cohost";

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

  const canPublish = input.role === "host" || input.role === "cohost";
  token.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: input.role === "host",
  });

  return token.toJwt();
}

function getRoomServiceClient() {
  const host = getLiveKitApiHost();
  if (!host) {
    throw new Error("Live streaming is not configured yet.");
  }
  return new RoomServiceClient(host, process.env.LIVEKIT_API_KEY!.trim(), process.env.LIVEKIT_API_SECRET!.trim());
}

export async function setRemoteParticipantSourceMuted(input: {
  roomName: string;
  identity: string;
  source: "microphone" | "camera";
  muted: boolean;
}) {
  if (!isLiveKitConfigured()) {
    throw new Error("Live streaming is not configured yet.");
  }

  const client = getRoomServiceClient();
  const participants = await client.listParticipants(input.roomName);
  const participant = participants.find((entry) => entry.identity === input.identity);
  if (!participant) {
    throw new Error("Guest is not connected to the room right now.");
  }

  const trackSource =
    input.source === "camera" ? TrackSource.CAMERA : TrackSource.MICROPHONE;
  const track = participant.tracks.find((entry) => entry.source === trackSource);
  if (!track?.sid) {
    throw new Error(input.source === "camera" ? "Guest video is off." : "Guest mic is off.");
  }

  await client.mutePublishedTrack(input.roomName, input.identity, track.sid, input.muted);
}
