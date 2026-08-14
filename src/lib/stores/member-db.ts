import type {
  Comment,
  CommunityPost,
  KidCheckIn,
  UnavailabilityRequest,
  VolunteerCheckIn,
} from "@/lib/member-types";
import { prisma } from "@/lib/db";

function mapComment(record: {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}): Comment {
  return {
    id: record.id,
    author: record.author,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapCommunityPost(record: {
  id: string;
  author: string;
  campusId: string;
  content: string;
  timeAgo: string;
  type: string;
  reactions: number;
  targetGroupId: string | null;
  targetGroupName: string | null;
  comments: {
    id: string;
    author: string;
    content: string;
    createdAt: Date;
  }[];
}): CommunityPost {
  return {
    id: record.id,
    author: record.author,
    campusId: record.campusId,
    content: record.content,
    timeAgo: record.timeAgo,
    type: record.type as CommunityPost["type"],
    reactions: record.reactions,
    targetGroupId: record.targetGroupId ?? undefined,
    targetGroupName: record.targetGroupName ?? undefined,
    comments: record.comments.map(mapComment),
  };
}

function mapVolunteerCheckIn(record: {
  id: string;
  name: string;
  ministry: string;
  checkedInAt: Date;
  atChurch: boolean;
  distanceMeters: number;
}): VolunteerCheckIn {
  return {
    id: record.id,
    name: record.name,
    ministry: record.ministry,
    checkedInAt: record.checkedInAt.toISOString(),
    atChurch: record.atChurch,
    distanceMeters: Math.round(record.distanceMeters),
  };
}

function mapKidCheckIn(record: {
  id: string;
  parentName: string;
  childName: string;
  ageGroup: string;
  service: string;
  notes: string | null;
  securityCode: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
}): KidCheckIn {
  return {
    id: record.id,
    parentName: record.parentName,
    childName: record.childName,
    ageGroup: record.ageGroup,
    service: record.service,
    notes: record.notes ?? undefined,
    securityCode: record.securityCode,
    checkedInAt: record.checkedInAt.toISOString(),
    checkedOutAt: record.checkedOutAt?.toISOString(),
  };
}

function mapUnavailabilityRequest(record: {
  id: string;
  personName: string;
  group: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}): UnavailabilityRequest {
  return {
    id: record.id,
    personName: record.personName,
    group: record.group as UnavailabilityRequest["group"],
    startDate: record.startDate,
    endDate: record.endDate,
    reason: record.reason,
    status: record.status as UnavailabilityRequest["status"],
    submittedAt: record.submittedAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy ?? undefined,
  };
}

const postInclude = {
  comments: { orderBy: { createdAt: "asc" as const } },
};

async function findCommunityPost(postId: string) {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: postInclude,
  });
  return post ? mapCommunityPost(post) : null;
}

export async function getCommunityPosts() {
  const posts = await prisma.communityPost.findMany({
    include: postInclude,
    orderBy: { createdAt: "desc" },
  });
  return posts.map(mapCommunityPost);
}

export async function saveCommunityPosts(posts: CommunityPost[]) {
  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany();
    await tx.communityPost.deleteMany();

    for (const post of posts) {
      await tx.communityPost.create({
        data: {
          id: post.id,
          author: post.author,
          campusId: post.campusId,
          content: post.content,
          timeAgo: post.timeAgo,
          type: post.type,
          reactions: post.reactions,
          targetGroupId: post.targetGroupId ?? null,
          targetGroupName: post.targetGroupName ?? null,
          createdAt: new Date(),
          comments: {
            create: (post.comments ?? []).map((comment) => ({
              id: comment.id,
              author: comment.author,
              content: comment.content,
              createdAt: new Date(comment.createdAt),
            })),
          },
        },
      });
    }
  });
}

export async function addCommunityPost(post: CommunityPost) {
  const created = await prisma.communityPost.create({
    data: {
      id: post.id,
      author: post.author,
      campusId: post.campusId,
      content: post.content,
      timeAgo: post.timeAgo,
      type: post.type,
      reactions: post.reactions,
      targetGroupId: post.targetGroupId ?? null,
      targetGroupName: post.targetGroupName ?? null,
      createdAt: new Date(),
      comments: {
        create: (post.comments ?? []).map((comment) => ({
          id: comment.id,
          author: comment.author,
          content: comment.content,
          createdAt: new Date(comment.createdAt),
        })),
      },
    },
    include: postInclude,
  });

  return mapCommunityPost(created);
}

export async function addCommentToPost(postId: string, comment: Comment) {
  const existing = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!existing) return null;

  await prisma.comment.create({
    data: {
      id: comment.id,
      postId,
      author: comment.author,
      content: comment.content,
      createdAt: new Date(comment.createdAt),
    },
  });

  return findCommunityPost(postId);
}

export async function reactToPost(postId: string) {
  const existing = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!existing) return null;

  const updated = await prisma.communityPost.update({
    where: { id: postId },
    data: { reactions: { increment: 1 } },
    include: postInclude,
  });

  return mapCommunityPost(updated);
}

export async function getVolunteerCheckIns() {
  const checkins = await prisma.volunteerCheckIn.findMany({
    orderBy: { checkedInAt: "desc" },
  });
  return checkins.map(mapVolunteerCheckIn);
}

export async function addVolunteerCheckIn(entry: VolunteerCheckIn) {
  const created = await prisma.volunteerCheckIn.create({
    data: {
      id: entry.id,
      name: entry.name,
      ministry: entry.ministry,
      checkedInAt: new Date(entry.checkedInAt),
      atChurch: entry.atChurch,
      distanceMeters: entry.distanceMeters,
    },
  });
  return mapVolunteerCheckIn(created);
}

export async function getKidCheckIns() {
  const checkins = await prisma.kidCheckIn.findMany({
    orderBy: { checkedInAt: "desc" },
  });
  return checkins.map(mapKidCheckIn);
}

export async function addKidCheckIn(entry: KidCheckIn) {
  const created = await prisma.kidCheckIn.create({
    data: {
      id: entry.id,
      parentName: entry.parentName,
      childName: entry.childName,
      ageGroup: entry.ageGroup,
      service: entry.service,
      notes: entry.notes,
      securityCode: entry.securityCode,
      checkedInAt: new Date(entry.checkedInAt),
    },
  });
  return mapKidCheckIn(created);
}

export async function checkoutKid(id: string) {
  const existing = await prisma.kidCheckIn.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.kidCheckIn.update({
    where: { id },
    data: { checkedOutAt: new Date() },
  });
  return mapKidCheckIn(updated);
}

export async function getUnavailabilityRequests() {
  const requests = await prisma.unavailabilityRequest.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return requests.map(mapUnavailabilityRequest);
}

export async function addUnavailabilityRequest(request: UnavailabilityRequest) {
  const created = await prisma.unavailabilityRequest.create({
    data: {
      id: request.id,
      personName: request.personName,
      group: request.group,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
      status: request.status,
      submittedAt: new Date(request.submittedAt),
      reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : null,
      reviewedBy: request.reviewedBy,
    },
  });
  return mapUnavailabilityRequest(created);
}

export async function updateUnavailabilityRequest(
  id: string,
  update: Partial<UnavailabilityRequest>,
) {
  const existing = await prisma.unavailabilityRequest.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.unavailabilityRequest.update({
    where: { id },
    data: {
      personName: update.personName,
      group: update.group,
      startDate: update.startDate,
      endDate: update.endDate,
      reason: update.reason,
      status: update.status,
      reviewedAt: update.reviewedAt ? new Date(update.reviewedAt) : undefined,
      reviewedBy: update.reviewedBy,
    },
  });
  return mapUnavailabilityRequest(updated);
}
