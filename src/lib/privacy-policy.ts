import { site } from "@/lib/site";

export const privacyPolicyMeta = {
  effectiveDate: "August 17, 2026",
  lastUpdated: "August 17, 2026",
  contactEmail: site.email,
  churchName: site.name,
  address: site.address,
  phone: site.phone,
  appUrl: "https://shanah-city.vercel.app",
} as const;

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const privacyPolicySections: PrivacySection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      `${site.name} (“we,” “us,” or “our”) operates the Shanah City mobile app and website (together, the “App”). This Privacy Policy explains what information we collect, how we use it, and the choices you have.`,
      "By creating an account, using the App, or submitting information through our guest form, you agree to this Privacy Policy. If you do not agree, please do not use the App.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    paragraphs: ["We collect information in these ways:"],
    bullets: [
      "Account information you provide: name, email address, optional phone number, campus selection, profile photo, and password (stored in encrypted form).",
      "Optional profile details such as family members you add to your account.",
      "Content you submit in the App: community posts and comments, direct messages to other members, group join requests, calendar unavailability, worship or ministry-related information where you choose to participate, and photos you upload when authorized.",
      "Guest connect form (no account required): name and optional email, phone, visit date, service time, and notes.",
      "Check-in information when used for children’s ministry or volunteer check-in at events.",
      "Giving history when you give while signed in through our online giving tools; payment card details are processed by third-party providers (such as Stripe, PayPal, Cash App, Venmo, or Zelle) and are not stored on our servers.",
      "Technical data: session cookies, sign-in tokens, device push notification subscriptions (if you enable notifications), and basic activity related to your use of the App (for example, devotion read status on your profile).",
    ],
  },
  {
    id: "how-we-use",
    title: "How we use information",
    paragraphs: ["We use information to:"],
    bullets: [
      "Provide church services through the App, including worship planning tools, community features, messaging, groups, devotions, events, and media.",
      "Authenticate you and keep your account secure.",
      "Send notifications you have opted into (devotions, messages, announcements, worship reminders).",
      "Respond to guest connect submissions and follow up with visitors.",
      "Process donations and maintain giving records for signed-in members.",
      "Operate check-in, photo galleries, and ministry workflows authorized for leaders and admins.",
      "Improve the App, prevent abuse, and enforce our community standards.",
      "Comply with legal obligations.",
    ],
  },
  {
    id: "sharing",
    title: "How we share information",
    paragraphs: [
      "We do not sell your personal information. We share information only as described below:",
    ],
    bullets: [
      "With other members when you choose to post publicly, join groups, send messages, or appear in ministry schedules visible to authorized teams.",
      "With church leaders and admins who need access to carry out ministry operations (for example, guest follow-up, approvals, finance records, or usher schedules).",
      "With service providers that help us run the App, including hosting (Vercel), database storage (Neon PostgreSQL), file storage (Vercel Blob), email delivery (Resend for password reset), and payment processors for online giving.",
      "When required by law, court order, or to protect the safety of our community.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party links and services",
    paragraphs: [
      "The App may link to or embed content from YouTube, Facebook, Instagram, and other external giving or streaming services. Those services have their own privacy policies. Information you provide directly to them is governed by their terms, not this policy.",
      "When you tap to give through Cash App, Venmo, PayPal, Zelle, Stripe, or another external provider, you leave our in-app browser or are redirected to that provider’s platform.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    paragraphs: [
      "We keep account and ministry-related information while your account is active or as needed to provide church services. Guest submissions and giving records may be retained as required for follow-up, accounting, or legal purposes.",
      "You may request deletion of your account by contacting us. Some information may be retained where required by law or legitimate church record-keeping needs.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational measures to protect information, including encrypted connections (HTTPS), hashed passwords, and access controls for leader and admin features.",
      "No method of transmission or storage is completely secure. Please use a strong password and keep your sign-in credentials private.",
    ],
  },
  {
    id: "children",
    title: "Children’s information",
    paragraphs: [
      "The App is intended for general church use. Parents or guardians may add family members to an account or use children’s check-in features. If you believe we have collected personal information from a child in error, contact us and we will take appropriate steps.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    paragraphs: ["You can:"],
    bullets: [
      "Update profile information in the App.",
      "Control notification preferences in your profile.",
      "Disable push notifications in your device settings.",
      "Block or report other members in messaging features.",
      "Request access, correction, or deletion of your information by emailing us.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will post the updated version in the App and change the “Last updated” date. Continued use of the App after changes means you accept the updated policy.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    paragraphs: [
      `Questions about this Privacy Policy or your data may be sent to ${site.email} or by mail to ${site.name}, ${site.address}. You may also call ${site.phone} during office hours (${site.officeHours}).`,
    ],
  },
];
