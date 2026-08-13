import type {
  Campus,
  Devotion,
  Leader,
  LiveStream,
  Meeting,
  QuickAction,
  ShopProduct,
} from "./types";

export const site = {
  name: "Shanah City",
  website: "https://shanahcity.org",
  tagline: "We are changed unto His glorious image.",
  scripture: "2 Corinthians 3:18",
  mission:
    "Changing lives to higher levels in God.",
  description:
    "Shanah City is a non-denominational, charismatic church in Colorado that is diverse and family oriented. We believe in creating a space where people can meet Jesus, engage in life-giving community, and discover their gifts to use for God's glory.",
  welcome:
    "Come taste and see that the Lord is good. — Psalms 34:8",
  location: "Aurora, Colorado",
  address: "380 S Potomac Street, Aurora, CO 80012",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=380+S+Potomac+Street+Aurora+CO+80012",
  coordinates: {
    lat: 39.697979,
    lng: -104.864681,
    radiusMeters: 200,
  },
  phone: "720-278-3175",
  email: "admin@shanahcity.org",
  officeHours: "Monday–Friday, 9:00 AM – 5:00 PM",
  serviceTimes: [
    {
      day: "Friday Evenings",
      time: "7:00 PM – 9:30 PM",
      label: "Worship Service",
    },
    {
      day: "Sunday Mornings",
      time: "10:00 AM – 12:30 PM",
      label: "Worship Service",
    },
  ],
  visitInfo: {
    duration: "A typical service lasts about 2.5 hours.",
    worship:
      "Contemporary and traditional music led by Shanah City Worship in an engaging, prophetic atmosphere.",
    highlights: [
      "Engaging worship & prophetic atmosphere",
      "Friendly, diverse community",
      "Children's ministry & childcare",
      "Fellowship, coffee & donuts",
    ],
  },
  nav: [
    { label: "Home", href: "/", icon: "⌂" },
    { label: "Media", href: "/live", icon: "▶" },
    { label: "Devotions", href: "/devotions", icon: "✦" },
    { label: "Meetings", href: "/meetings", icon: "▣" },
    { label: "Community", href: "/community", icon: "♡" },
    { label: "Groups", href: "/groups", icon: "◉" },
    { label: "Messages", href: "/messages", icon: "💬" },
    { label: "Calendar", href: "/calendar", icon: "◷" },
    { label: "Check-in", href: "/check-in", icon: "✓" },
    { label: "Photos", href: "/photos", icon: "▤" },
    { label: "Shop", href: "/shop", icon: "◈" },
    { label: "Campuses", href: "/campuses", icon: "◎" },
    { label: "Give", href: "/give", icon: "♢" },
    { label: "Profile", href: "/profile", icon: "☺" },
    { label: "Write Devotions", href: "/admin/devotions", icon: "✎" },
  ],
  social: {
    youtube: "https://www.youtube.com/@ShanahCity",
    facebook: [
      {
        name: "Shanah City",
        url: "https://www.facebook.com/ShanahCity",
      },
      {
        name: "Shanah Revival",
        url: "https://www.facebook.com/ShanahRevival",
      },
    ],
    instagram: [
      {
        name: "Shanah City",
        handle: "shanahcity",
        url: "https://www.instagram.com/shanahcity",
      },
      {
        name: "Shanah Revival",
        handle: "shanah_revival",
        url: "https://www.instagram.com/shanah_revival",
      },
    ],
  },
  giving: {
    verse:
      "For where your treasure is, there your heart will be also.",
    reference: "Matthew 6:21",
    why:
      "God is generous and so he calls us to be as well. What we do with what God has given us shows the world where our hearts are at and helps proclaim the gospel. We want to glorify God with every area of our lives, and that includes what we do with our finances.",
    methods: [
      {
        title: "Give Online",
        description:
          "Give securely online through shanahcity.org — one-time or recurring.",
      },
      {
        title: "Give In Person",
        description:
          "Give during any Friday or Sunday service at Shanah City in Aurora, Colorado.",
      },
      {
        title: "Mail a Check",
        description:
          "Contact admin@shanahcity.org for mailing instructions.",
      },
    ],
  },
  visitCTA: {
    label: "Plan a visit",
    href: "/connect",
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "hover:from-blue-600 hover:to-indigo-700",
  },
} as const;

export const leadership: Leader[] = [
  { name: "Aps. Zaq Nombre", role: "Lead Shepherd" },
  {
    name: "Nayram Sanaki",
    role: "Associate Pastor & Children's Director",
  },
  { name: "Mary Asibey", role: "Prayer Ministry" },
  { name: "Joy Tugume", role: "Worship Pastor" },
  { name: "Alvin Tugume", role: "Production & Sound" },
  { name: "Jozzy Owusu", role: "Administrator" },
];

export const campuses: Campus[] = [
  {
    id: "colorado",
    name: "Shanah City",
    city: "Aurora",
    country: "Colorado, USA",
    timezone: "America/Denver",
    pastor: "Aps. Zaq Nombre",
    serviceTimes: ["Fri 7:00 PM", "Sun 10:00 AM"],
    address: "380 S Potomac Street, Aurora, CO 80012",
    isLive: false,
  },
  {
    id: "accra",
    name: "Shanah City Accra",
    city: "Accra",
    country: "Ghana",
    timezone: "Africa/Accra",
    pastor: "Regional Pastor",
    serviceTimes: ["Contact campus for service times"],
    address: "Accra, Ghana",
  },
  {
    id: "online",
    name: "Shanah City Online",
    city: "Worldwide",
    country: "Global",
    timezone: "UTC",
    pastor: "Shanah City Team",
    serviceTimes: ["Stream Fri & Sun (MT)"],
  },
];

export const liveStream: LiveStream = {
  isLive: false,
  title: "Shanah City Worship",
  campusId: "colorado",
  viewerCount: 0,
  scheduledAt: "Friday 7:00 PM · Sunday 10:00 AM (Mountain Time)",
  chatEnabled: true,
  youtube: {
    channelUrl: "https://www.youtube.com/@ShanahCity",
    embedUrl: "",
    videoId: "",
    isLive: false,
  },
  facebook: {
    isLive: false,
    shanahCity: {
      pageUrl: "https://www.facebook.com/ShanahCity",
      embedUrl:
        "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FShanahCity&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false",
    },
    shanahRevival: {
      pageUrl: "https://www.facebook.com/ShanahRevival",
      embedUrl:
        "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FShanahRevival&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false",
    },
  },
};

export const devotions: Devotion[] = [
  {
    id: "1",
    title: "Changed Into His Image",
    verse:
      "And we all, who with unveiled faces contemplate the Lord's glory, are being transformed into his image with ever-increasing glory.",
    reference: "2 Corinthians 3:18",
    readingTime: "3 min",
    date: "Aug 12, 2026",
    content:
      "This is the heart of Shanah City — we are being changed unto His glorious image. Today, spend a moment beholding Jesus. Transformation doesn't come from striving harder, but from gazing at His glory and letting His Spirit work in you.",
    prayer:
      "Lord, transform me into your image today. Unveil my heart to see your glory. Amen.",
  },
  {
    id: "2",
    title: "Taste and See",
    verse: "Taste and see that the Lord is good; blessed is the one who takes refuge in him.",
    reference: "Psalm 34:8",
    readingTime: "3 min",
    date: "Aug 11, 2026",
    content:
      "Faith is not just believing facts about God — it's experiencing His goodness. Come to Him today with openness. Whether you're new in your walk or seeking deeper growth, He invites you to taste and see for yourself.",
    prayer: "Father, help me experience your goodness in a fresh way today. Amen.",
  },
  {
    id: "3",
    title: "Faith Through the Word",
    verse: "Faith comes from hearing the message, and the message is heard through the word about Christ.",
    reference: "Romans 10:17",
    readingTime: "4 min",
    date: "Aug 10, 2026",
    content:
      "One word from God can change everything. Faith begins, grows, and strengthens through hearing the Word of God. Make space today to listen — through scripture, worship, or a message from Shanah City.",
    prayer: "Speak to me through your Word today, Lord. Build my faith. Amen.",
  },
];

export const meetings: Meeting[] = [
  {
    id: "1",
    title: "Friday Evening Service",
    campusId: "colorado",
    host: "Shanah City Worship",
    schedule: "Friday 7:00 PM – 9:30 PM MT",
    platform: "zoom",
    joinUrl: "https://shanahcity.org/contact",
  },
  {
    id: "2",
    title: "Sunday Morning Service",
    campusId: "colorado",
    host: "Shanah City Worship",
    schedule: "Sunday 10:00 AM – 12:30 PM MT",
    platform: "zoom",
    joinUrl: "https://shanahcity.org/contact",
  },
  {
    id: "3",
    title: "Prayer Ministry",
    campusId: "colorado",
    host: "Mary Asibey",
    schedule: "Contact for schedule",
    platform: "zoom",
    joinUrl: "https://shanahcity.org/contact",
  },
  {
    id: "4",
    title: "Watch Online",
    campusId: "online",
    host: "Shanah City Team",
    schedule: "Fri & Sun services",
    platform: "teams",
    joinUrl: "https://www.youtube.com/@ShanahCity",
  },
  {
    id: "5",
    title: "Accra Campus Service",
    campusId: "accra",
    host: "Shanah City Accra",
    schedule: "Contact for schedule",
    platform: "zoom",
    joinUrl: "https://shanahcity.org/contact",
  },
];

export const shopProducts: ShopProduct[] = [
  {
    id: "1",
    name: "Shanah City Tee",
    price: 28,
    category: "Apparel",
    image: "👕",
    description: "Represent Shanah City with our official church tee.",
    badge: "Popular",
  },
  {
    id: "2",
    name: "Faith Journal",
    price: 18,
    category: "Books",
    image: "📔",
    description: "A guided journal for daily reflection and prayer.",
  },
  {
    id: "3",
    name: "Shanah City Worship",
    price: 12,
    category: "Music",
    image: "🎵",
    description: "Worship music from Shanah City Worship team.",
    badge: "New",
  },
  {
    id: "4",
    name: "Church Mug",
    price: 16,
    category: "Merch",
    image: "☕",
    description: "Start your morning rooted in community.",
  },
  {
    id: "5",
    name: "Kids Ministry Pack",
    price: 22,
    category: "Kids",
    image: "📚",
    description: "Resources for children connected to our kids ministry.",
  },
];

export const quickActions: QuickAction[] = [
  { label: "Watch Live", href: "/live", icon: "▶", color: "from-red-500 to-rose-600" },
  { label: "Today's Devotion", href: "/devotions", icon: "✦", color: "from-amber-500 to-orange-600" },
  { label: "Plan a Visit", href: "/connect", icon: "▣", color: "from-blue-500 to-indigo-600" },
  { label: "Prayer Wall", href: "/community", icon: "♡", color: "from-emerald-500 to-teal-600" },
  { label: "Give", href: "/give", icon: "♢", color: "from-violet-500 to-purple-600" },
  { label: "Sermons", href: "/sermons", icon: "◈", color: "from-sand-500 to-amber-700" },
];

export const upcomingEvents = [
  {
    id: "1",
    title: "Friday Evening Worship",
    date: "Every Friday",
    time: "7:00 PM – 9:30 PM",
    location: site.address,
  },
  {
    id: "2",
    title: "Sunday Morning Worship",
    date: "Every Sunday",
    time: "10:00 AM – 12:30 PM",
    location: site.address,
  },
  {
    id: "3",
    title: "Shanah City Accra",
    date: "Weekly",
    time: "Contact campus for times",
    location: "Accra, Ghana",
  },
  {
    id: "4",
    title: "Watch Online",
    date: "Fri & Sun",
    time: "Live on YouTube",
    location: "youtube.com/@ShanahCity",
  },
] as const;

export const latestSermon = {
  title: "Faith Through the Word",
  speaker: "Shanah City",
  date: "Latest message",
  series: "Messages",
  description:
    "One word from God can change everything! Discover how faith begins, grows, and strengthens through hearing the Word of God. Whether you're new in your walk or seeking deeper spiritual growth, these messages will encourage and equip you.",
  youtubeUrl: "https://www.youtube.com/@ShanahCity",
} as const;

export function getCampus(id: string) {
  return campuses.find((campus) => campus.id === id) ?? campuses[0];
}
