export function getLiveKitPublicUrl() {
  const fromPublic = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim();
  if (fromPublic) return fromPublic;

  const fromServer = process.env.LIVEKIT_URL?.trim();
  if (!fromServer) return "";

  if (fromServer.startsWith("wss://") || fromServer.startsWith("ws://")) {
    return fromServer;
  }
  if (fromServer.startsWith("https://")) {
    return fromServer.replace(/^https:\/\//i, "wss://");
  }
  if (fromServer.startsWith("http://")) {
    return fromServer.replace(/^http:\/\//i, "ws://");
  }
  return `wss://${fromServer.replace(/^\/\//, "")}`;
}

export function isLiveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim() &&
      getLiveKitPublicUrl(),
  );
}
