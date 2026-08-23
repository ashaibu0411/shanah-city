export function liveStreamShareMessage(input: {
  title: string;
  url: string;
  isLive?: boolean;
  platform?: string;
}) {
  const headline = input.isLive ? "We're live!" : "Watch with Shanah City";
  const platformLine = input.platform ? ` on ${input.platform}` : "";
  const lines = [
    `${headline} — ${input.title}${platformLine}`,
    "",
    "Open in the Shanah City app or share with a friend:",
    input.url,
  ];
  return lines.join("\n");
}

export function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
