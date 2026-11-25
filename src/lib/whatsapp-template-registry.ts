// Provider approval must be verified independently before outbound delivery.
export const WHATSAPP_TEMPLATES = {
  service_reminder: { sid: "HXda074947d1f69b2dcaef0ee90b3e853b", category: "marketing", fields: ["name", "service", "date", "time"] },
  church_announcement: { sid: "HX58687e145d0655dd2b31929e1913db3b", category: "marketing", fields: ["name", "subject", "announcement"] },
  event_reminder: { sid: "HXc7c57e321b65f408e3f9a7ebab0d2e6f", category: "marketing", fields: ["name", "event", "date", "time", "location"] },
  daily_devotion: { sid: "HX44f34ad3718aa5e07a1c0fedc0c93a6a", category: "marketing", fields: ["name", "topic", "scripture", "excerpt"] },
  parent_alert: { sid: "HX97e5b3434db8450525857e8bfe0b4dc6", category: "utility", fields: ["name", "classroom"] },
  leadership_reminder: { sid: "HXb0e95c158e6e6e8fe054cfc7c8b6563d", category: "utility", fields: ["name", "assignment", "date", "time"] },
  guest_welcome: { sid: "HX72c21bd2225b1a5e4b8c98c5213bd61f", category: "marketing", fields: ["name", "date"] },
  ministry_update: { sid: "HX99f37b3edea482ddfae31af4e9bec9e6", category: "marketing", fields: ["name", "ministry", "subject", "update"] },
} as const;
export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES;
export function buildWhatsAppVariables(key: WhatsAppTemplateKey, values: Record<string, string>) {
  const fields = WHATSAPP_TEMPLATES[key].fields;
  return Object.fromEntries(fields.map((field, index) => {
    const value = values[field]?.trim();
    if (!value || value.length > 500 || /[\r\n\t]/.test(value)) throw new Error("Invalid template variable: " + field);
    return [String(index + 1), value];
  }));
}
