import { prisma } from "@/lib/db";

export type CoupleGameStateRecord = {
  id: string;
  coupleLinkId: string;
  gameType: string;
  stateJson: string;
  updatedAt: string;
};

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  gameType: string;
  stateJson: string;
  updatedAt: Date;
}): CoupleGameStateRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    gameType: row.gameType,
    stateJson: row.stateJson,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCoupleGameState(coupleLinkId: string, gameType: string) {
  const row = await prisma.coupleGameState.findUnique({
    where: { coupleLinkId_gameType: { coupleLinkId, gameType } },
  });
  return row ? mapRow(row) : null;
}

export async function upsertCoupleGameState(input: {
  coupleLinkId: string;
  gameType: string;
  stateJson: string;
}) {
  const existing = await prisma.coupleGameState.findUnique({
    where: { coupleLinkId_gameType: { coupleLinkId: input.coupleLinkId, gameType: input.gameType } },
  });

  if (existing) {
    const row = await prisma.coupleGameState.update({
      where: { id: existing.id },
      data: { stateJson: input.stateJson },
    });
    return mapRow(row);
  }

  const row = await prisma.coupleGameState.create({
    data: {
      id: `cgame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      gameType: input.gameType,
      stateJson: input.stateJson,
    },
  });
  return mapRow(row);
}
