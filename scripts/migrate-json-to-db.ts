import "./load-project-env";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";

const DATA_DIR = path.join(process.cwd(), "data");

type JsonUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  campusId: string;
  role?: string;
  avatarUrl?: string;
  passwordHash: string;
  notificationPrefs?: {
    pushEnabled?: boolean;
    devotions?: boolean;
    messages?: boolean;
    announcements?: boolean;
  };
  family?: {
    id: string;
    name: string;
    relationship: string;
    birthYear?: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

type JsonSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

type JsonActivity = {
  id: string;
  userId: string;
  type: string;
  label: string;
  createdAt: string;
};

type JsonMessageThread = {
  id: string;
  participantIds: [string, string];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

type JsonMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
};

type JsonUserBlock = {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  createdAt: string;
};

type JsonMessageReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId?: string;
  reason: string;
  status?: string;
  createdAt: string;
};

type JsonGroup = {
  id: string;
  name: string;
  description: string;
  category: string;
  campusId?: string;
  createdBy: string;
  creatorName: string;
  visibility: string;
  meetingSchedule?: string;
  meetingLink?: string;
  memberIds: string[];
  adminIds: string[];
  createdAt: string;
  updatedAt: string;
};

type JsonCommunityPost = {
  id: string;
  author: string;
  campusId: string;
  content: string;
  timeAgo: string;
  type: string;
  reactions: number;
  createdAt?: string;
  comments?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }[];
};

type JsonDevotion = {
  id: string;
  title: string;
  verse: string;
  reference: string;
  readingTime: string;
  content: string;
  prayer: string;
  date: string;
  published?: boolean;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type JsonPushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  subscription: object;
  createdAt: string;
  updatedAt?: string;
};

type JsonVolunteerCheckIn = {
  id: string;
  name: string;
  ministry: string;
  checkedInAt: string;
  atChurch: boolean;
  distanceMeters: number;
};

type JsonKidCheckIn = {
  id: string;
  parentName: string;
  childName: string;
  ageGroup: string;
  service: string;
  notes?: string;
  securityCode: string;
  checkedInAt: string;
  checkedOutAt?: string;
};

type JsonUnavailabilityRequest = {
  id: string;
  personName: string;
  group: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

type JsonGalleryPhoto = {
  id: string;
  url: string;
  title: string;
  album: string;
  uploadedAt: string;
  uploadedBy?: string;
  linkProvider?: string;
  visibility?: string;
};

type JsonGalleryDownload = {
  id: string;
  photoId: string;
  photoTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  downloadedAt: string;
  acceptedPolicy: boolean;
  policyVersion: string;
};

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    console.log(`  skip ${filename} (missing or unreadable)`);
    return fallback;
  }
}

function threadParticipants(ids: [string, string]): [string, string] {
  return ids[0] < ids[1] ? [ids[0], ids[1]] : [ids[1], ids[0]];
}

export async function migrateUsers() {
  console.log("Importing users, family members...");
  const users = await readJsonFile<JsonUser[]>("users.json", []);
  let count = 0;

  for (const user of users) {
    const prefs = user.notificationPrefs ?? {};
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        phone: user.phone?.trim() || null,
        campusId: user.campusId,
        role: user.role ?? "member",
        avatarUrl: user.avatarUrl || null,
        passwordHash: user.passwordHash,
        pushEnabled: prefs.pushEnabled ?? true,
        notifyDevotions: prefs.devotions ?? true,
        notifyMessages: prefs.messages ?? true,
        notifyAnnouncements: prefs.announcements ?? true,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
      update: {
        name: user.name,
        email: user.email.trim().toLowerCase(),
        phone: user.phone?.trim() || null,
        campusId: user.campusId,
        role: user.role ?? "member",
        avatarUrl: user.avatarUrl || null,
        passwordHash: user.passwordHash,
        pushEnabled: prefs.pushEnabled ?? true,
        notifyDevotions: prefs.devotions ?? true,
        notifyMessages: prefs.messages ?? true,
        notifyAnnouncements: prefs.announcements ?? true,
        updatedAt: new Date(user.updatedAt),
      },
    });

    for (const member of user.family ?? []) {
      await prisma.familyMember.upsert({
        where: { id: member.id },
        create: {
          id: member.id,
          userId: user.id,
          name: member.name,
          relationship: member.relationship,
          birthYear: member.birthYear || null,
          notes: member.notes || null,
        },
        update: {
          userId: user.id,
          name: member.name,
          relationship: member.relationship,
          birthYear: member.birthYear || null,
          notes: member.notes || null,
        },
      });
    }

    count += 1;
  }

  console.log(`  ${count} users imported`);
}

export async function migrateSessions() {
  console.log("Importing sessions...");
  const sessions = await readJsonFile<JsonSession[]>("sessions.json", []);
  let count = 0;

  for (const session of sessions) {
    await prisma.session.upsert({
      where: { token: session.token },
      create: {
        token: session.token,
        userId: session.userId,
        expiresAt: new Date(session.expiresAt),
      },
      update: {
        userId: session.userId,
        expiresAt: new Date(session.expiresAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} sessions imported`);
}

export async function migrateActivity() {
  console.log("Importing activity logs...");
  const entries = await readJsonFile<JsonActivity[]>("activity.json", []);
  let count = 0;

  for (const entry of entries) {
    await prisma.activityLog.upsert({
      where: { id: entry.id },
      create: {
        id: entry.id,
        userId: entry.userId,
        type: entry.type,
        label: entry.label,
        createdAt: new Date(entry.createdAt),
      },
      update: {
        userId: entry.userId,
        type: entry.type,
        label: entry.label,
        createdAt: new Date(entry.createdAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} activity logs imported`);
}

async function migrateMessageThreads() {
  console.log("Importing message threads...");
  const threads = await readJsonFile<JsonMessageThread[]>("message-threads.json", []);
  let count = 0;

  for (const thread of threads) {
    const [participantAId, participantBId] = threadParticipants(thread.participantIds);
    await prisma.messageThread.upsert({
      where: { id: thread.id },
      create: {
        id: thread.id,
        participantAId,
        participantBId,
        participantNames: thread.participantNames,
        lastMessage: thread.lastMessage,
        lastMessageAt: new Date(thread.lastMessageAt),
        createdAt: new Date(thread.createdAt),
      },
      update: {
        participantAId,
        participantBId,
        participantNames: thread.participantNames,
        lastMessage: thread.lastMessage,
        lastMessageAt: new Date(thread.lastMessageAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} message threads imported`);
}

async function migrateMessages() {
  console.log("Importing messages...");
  const messages = await readJsonFile<JsonMessage[]>("messages.json", []);
  let count = 0;

  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        threadId: message.threadId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        createdAt: new Date(message.createdAt),
        readAt: message.readAt ? new Date(message.readAt) : null,
      },
      update: {
        threadId: message.threadId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        createdAt: new Date(message.createdAt),
        readAt: message.readAt ? new Date(message.readAt) : null,
      },
    });
    count += 1;
  }

  console.log(`  ${count} messages imported`);
}

async function migrateBlocks() {
  console.log("Importing user blocks...");
  const blocks = await readJsonFile<JsonUserBlock[]>("message-blocks.json", []);
  let count = 0;

  for (const block of blocks) {
    await prisma.userBlock.upsert({
      where: { id: block.id },
      create: {
        id: block.id,
        blockerId: block.blockerId,
        blockedUserId: block.blockedUserId,
        blockedUserName: block.blockedUserName,
        createdAt: new Date(block.createdAt),
      },
      update: {
        blockerId: block.blockerId,
        blockedUserId: block.blockedUserId,
        blockedUserName: block.blockedUserName,
        createdAt: new Date(block.createdAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} user blocks imported`);
}

async function migrateReports() {
  console.log("Importing message reports...");
  const reports = await readJsonFile<JsonMessageReport[]>("message-reports.json", []);
  let count = 0;

  for (const report of reports) {
    await prisma.messageReport.upsert({
      where: { id: report.id },
      create: {
        id: report.id,
        reporterId: report.reporterId,
        reporterName: report.reporterName,
        reportedUserId: report.reportedUserId,
        reportedUserName: report.reportedUserName,
        threadId: report.threadId || null,
        reason: report.reason,
        status: report.status ?? "open",
        createdAt: new Date(report.createdAt),
      },
      update: {
        reporterId: report.reporterId,
        reporterName: report.reporterName,
        reportedUserId: report.reportedUserId,
        reportedUserName: report.reportedUserName,
        threadId: report.threadId || null,
        reason: report.reason,
        status: report.status ?? "open",
        createdAt: new Date(report.createdAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} message reports imported`);
}

async function migrateGroups() {
  console.log("Importing groups...");
  const groups = await readJsonFile<JsonGroup[]>("groups.json", []);
  let count = 0;

  for (const group of groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        campusId: group.campusId || null,
        createdBy: group.createdBy,
        creatorName: group.creatorName,
        visibility: group.visibility,
        meetingSchedule: group.meetingSchedule || null,
        meetingLink: group.meetingLink || null,
        memberIds: group.memberIds,
        adminIds: group.adminIds,
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt),
      },
      update: {
        name: group.name,
        description: group.description,
        category: group.category,
        campusId: group.campusId || null,
        createdBy: group.createdBy,
        creatorName: group.creatorName,
        visibility: group.visibility,
        meetingSchedule: group.meetingSchedule || null,
        meetingLink: group.meetingLink || null,
        memberIds: group.memberIds,
        adminIds: group.adminIds,
        updatedAt: new Date(group.updatedAt),
      },
    });
    count += 1;
  }

  console.log(`  ${count} groups imported`);
}

async function migrateCommunity() {
  console.log("Importing community posts and comments...");
  const posts = await readJsonFile<JsonCommunityPost[]>("community.json", []);
  let postCount = 0;
  let commentCount = 0;

  for (const post of posts) {
    const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
    await prisma.communityPost.upsert({
      where: { id: post.id },
      create: {
        id: post.id,
        author: post.author,
        campusId: post.campusId,
        content: post.content,
        timeAgo: post.timeAgo,
        type: post.type,
        reactions: post.reactions,
        createdAt,
      },
      update: {
        author: post.author,
        campusId: post.campusId,
        content: post.content,
        timeAgo: post.timeAgo,
        type: post.type,
        reactions: post.reactions,
      },
    });
    postCount += 1;

    for (const comment of post.comments ?? []) {
      await prisma.comment.upsert({
        where: { id: comment.id },
        create: {
          id: comment.id,
          postId: post.id,
          author: comment.author,
          content: comment.content,
          createdAt: new Date(comment.createdAt),
        },
        update: {
          postId: post.id,
          author: comment.author,
          content: comment.content,
          createdAt: new Date(comment.createdAt),
        },
      });
      commentCount += 1;
    }
  }

  console.log(`  ${postCount} posts, ${commentCount} comments imported`);
}

async function migrateDevotions() {
  console.log("Importing devotions...");
  const devotions = await readJsonFile<JsonDevotion[]>("devotions.json", []);
  let count = 0;

  for (const devotion of devotions) {
    const createdAt = devotion.createdAt ? new Date(devotion.createdAt) : null;
    const updatedAt = devotion.updatedAt ? new Date(devotion.updatedAt) : null;
    await prisma.devotion.upsert({
      where: { id: devotion.id },
      create: {
        id: devotion.id,
        title: devotion.title,
        verse: devotion.verse,
        reference: devotion.reference,
        readingTime: devotion.readingTime,
        content: devotion.content,
        prayer: devotion.prayer,
        date: devotion.date,
        published: devotion.published ?? true,
        authorId: devotion.authorId || null,
        authorName: devotion.authorName || null,
        createdAt,
        updatedAt,
      },
      update: {
        title: devotion.title,
        verse: devotion.verse,
        reference: devotion.reference,
        readingTime: devotion.readingTime,
        content: devotion.content,
        prayer: devotion.prayer,
        date: devotion.date,
        published: devotion.published ?? true,
        authorId: devotion.authorId || null,
        authorName: devotion.authorName || null,
        createdAt,
        updatedAt,
      },
    });
    count += 1;
  }

  console.log(`  ${count} devotions imported`);
}

async function migratePushSubscriptions() {
  console.log("Importing push subscriptions...");
  const subscriptions = await readJsonFile<JsonPushSubscription[]>(
    "push-subscriptions.json",
    [],
  );
  let count = 0;

  for (const item of subscriptions) {
    const createdAt = new Date(item.createdAt);
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : createdAt;
    await prisma.pushSubscription.upsert({
      where: { endpoint: item.endpoint },
      create: {
        id: item.id,
        userId: item.userId,
        endpoint: item.endpoint,
        subscription: item.subscription,
        createdAt,
        updatedAt,
      },
      update: {
        userId: item.userId,
        subscription: item.subscription,
        updatedAt,
      },
    });
    count += 1;
  }

  console.log(`  ${count} push subscriptions imported`);
}

async function migrateVolunteerCheckIns() {
  console.log("Importing volunteer check-ins...");
  const entries = await readJsonFile<JsonVolunteerCheckIn[]>("volunteer-checkins.json", []);
  let count = 0;

  for (const entry of entries) {
    await prisma.volunteerCheckIn.upsert({
      where: { id: entry.id },
      create: {
        id: entry.id,
        name: entry.name,
        ministry: entry.ministry,
        checkedInAt: new Date(entry.checkedInAt),
        atChurch: entry.atChurch,
        distanceMeters: entry.distanceMeters,
      },
      update: {
        name: entry.name,
        ministry: entry.ministry,
        checkedInAt: new Date(entry.checkedInAt),
        atChurch: entry.atChurch,
        distanceMeters: entry.distanceMeters,
      },
    });
    count += 1;
  }

  console.log(`  ${count} volunteer check-ins imported`);
}

async function migrateKidCheckIns() {
  console.log("Importing kids check-ins...");
  const entries = await readJsonFile<JsonKidCheckIn[]>("kids-checkins.json", []);
  let count = 0;

  for (const entry of entries) {
    await prisma.kidCheckIn.upsert({
      where: { id: entry.id },
      create: {
        id: entry.id,
        parentName: entry.parentName,
        childName: entry.childName,
        ageGroup: entry.ageGroup,
        service: entry.service,
        notes: entry.notes || null,
        securityCode: entry.securityCode,
        checkedInAt: new Date(entry.checkedInAt),
        checkedOutAt: entry.checkedOutAt ? new Date(entry.checkedOutAt) : null,
      },
      update: {
        parentName: entry.parentName,
        childName: entry.childName,
        ageGroup: entry.ageGroup,
        service: entry.service,
        notes: entry.notes || null,
        securityCode: entry.securityCode,
        checkedInAt: new Date(entry.checkedInAt),
        checkedOutAt: entry.checkedOutAt ? new Date(entry.checkedOutAt) : null,
      },
    });
    count += 1;
  }

  console.log(`  ${count} kids check-ins imported`);
}

async function migrateUnavailability() {
  console.log("Importing unavailability requests...");
  const requests = await readJsonFile<JsonUnavailabilityRequest[]>("unavailability.json", []);
  let count = 0;

  for (const request of requests) {
    await prisma.unavailabilityRequest.upsert({
      where: { id: request.id },
      create: {
        id: request.id,
        personName: request.personName,
        group: request.group,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
        status: request.status,
        submittedAt: new Date(request.submittedAt),
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : null,
        reviewedBy: request.reviewedBy || null,
      },
      update: {
        personName: request.personName,
        group: request.group,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
        status: request.status,
        submittedAt: new Date(request.submittedAt),
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : null,
        reviewedBy: request.reviewedBy || null,
      },
    });
    count += 1;
  }

  console.log(`  ${count} unavailability requests imported`);
}

async function migrateGallery() {
  console.log("Importing gallery photos...");
  const photos = await readJsonFile<JsonGalleryPhoto[]>("gallery.json", []);
  let photoCount = 0;

  for (const photo of photos) {
    await prisma.galleryPhoto.upsert({
      where: { id: photo.id },
      create: {
        id: photo.id,
        url: photo.url,
        title: photo.title,
        album: photo.album,
        uploadedAt: new Date(photo.uploadedAt),
        uploadedBy: photo.uploadedBy || null,
        linkProvider: photo.linkProvider || null,
        visibility: photo.visibility === "public" ? "public" : "private",
      },
      update: {
        url: photo.url,
        title: photo.title,
        album: photo.album,
        uploadedAt: new Date(photo.uploadedAt),
        uploadedBy: photo.uploadedBy || null,
        linkProvider: photo.linkProvider || null,
        visibility: photo.visibility === "public" ? "public" : "private",
      },
    });
    photoCount += 1;
  }

  console.log(`  ${photoCount} gallery photos imported`);
}

async function migrateGalleryDownloads() {
  console.log("Importing gallery downloads...");
  const downloads = await readJsonFile<JsonGalleryDownload[]>("gallery-downloads.json", []);
  let count = 0;

  for (const download of downloads) {
    await prisma.galleryDownload.upsert({
      where: { id: download.id },
      create: {
        id: download.id,
        photoId: download.photoId,
        photoTitle: download.photoTitle,
        userId: download.userId,
        userName: download.userName,
        userEmail: download.userEmail,
        downloadedAt: new Date(download.downloadedAt),
        acceptedPolicy: download.acceptedPolicy,
        policyVersion: download.policyVersion,
      },
      update: {
        photoId: download.photoId,
        photoTitle: download.photoTitle,
        userId: download.userId,
        userName: download.userName,
        userEmail: download.userEmail,
        downloadedAt: new Date(download.downloadedAt),
        acceptedPolicy: download.acceptedPolicy,
        policyVersion: download.policyVersion,
      },
    });
    count += 1;
  }

  console.log(`  ${count} gallery downloads imported`);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  console.log("Starting JSON → Postgres migration from data/");

  await migrateUsers();
  await migrateSessions();
  await migrateActivity();
  await migrateMessageThreads();
  await migrateMessages();
  await migrateBlocks();
  await migrateReports();
  await migrateGroups();
  await migrateCommunity();
  await migrateDevotions();
  await migratePushSubscriptions();
  await migrateVolunteerCheckIns();
  await migrateKidCheckIns();
  await migrateUnavailability();
  await migrateGallery();
  await migrateGalleryDownloads();

  console.log("Migration complete.");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
