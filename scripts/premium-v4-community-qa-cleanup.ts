import { prisma } from "../src/lib/db";

if (process.env.PREMIUM_V4_QA_CLEANUP_CONFIRMED !== "YES") {
  throw new Error(
    "Refusing cleanup: set PREMIUM_V4_QA_CLEANUP_CONFIRMED=YES after verifying DATABASE_URL is disposable QA/staging.",
  );
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error("DATABASE_URL is required for QA cleanup.");
}

async function main() {
  const qaUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@shanah-city-qa.invalid" } },
    select: { id: true, email: true },
  });
  if (qaUsers.length === 0) {
    console.log("No @shanah-city-qa.invalid users found.");
    return;
  }
  console.log(`Found ${qaUsers.length} synthetic QA user(s).`);
  const ids = qaUsers.map((u) => u.id);

  const syntheticPosts = await prisma.communityPost.findMany({
    where: { OR: [{ authorId: { in: ids } }, { content: { contains: "Synthetic" } }] },
    select: { id: true },
  });
  const postIds = syntheticPosts.map((p) => p.id);
  if (postIds.length > 0) {
    await prisma.communityPostReaction.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.communityPost.deleteMany({ where: { id: { in: postIds } } });
  }

  const statuses = await prisma.communityStatus.findMany({
    where: { authorId: { in: ids } },
    select: { id: true },
  });
  const statusIds = statuses.map((s) => s.id);
  if (statusIds.length > 0) {
    await prisma.communityStatusReply.deleteMany({ where: { statusId: { in: statusIds } } });
    await prisma.communityStatusReaction.deleteMany({ where: { statusId: { in: statusIds } } });
    await prisma.communityStatus.deleteMany({ where: { id: { in: statusIds } } });
  }

  await prisma.pushSubscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Removed ${ids.length} QA users and related Community records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
