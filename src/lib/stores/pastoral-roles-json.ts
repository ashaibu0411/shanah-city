import { promises as fs } from "fs";
import path from "path";
import type { PastoralRole, PastoralRoleAssignments } from "@/lib/pastoral-roles-types";

const FILE = path.join(process.cwd(), "data", "pastoral-roles.json");

const EMPTY: PastoralRoleAssignments = {
  seniorPastorUserId: null,
  associatePastorUserId: null,
};

async function readAssignments(): Promise<PastoralRoleAssignments> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as PastoralRoleAssignments;
    return {
      seniorPastorUserId: parsed.seniorPastorUserId ?? null,
      associatePastorUserId: parsed.associatePastorUserId ?? null,
      updatedAt: parsed.updatedAt,
      updatedBy: parsed.updatedBy,
      updatedByName: parsed.updatedByName,
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeAssignments(assignments: PastoralRoleAssignments) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(assignments, null, 2));
}

export async function getPastoralRoleAssignments() {
  return readAssignments();
}

export async function setPastoralRoleAssignment(input: {
  role: PastoralRole;
  userId: string | null;
  updatedBy: string;
  updatedByName: string;
}) {
  const current = await readAssignments();
  const next: PastoralRoleAssignments = {
    ...current,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy,
    updatedByName: input.updatedByName,
  };

  if (input.role === "senior_pastor") {
    next.seniorPastorUserId = input.userId;
    if (input.userId && next.associatePastorUserId === input.userId) {
      next.associatePastorUserId = null;
    }
  } else {
    next.associatePastorUserId = input.userId;
    if (input.userId && next.seniorPastorUserId === input.userId) {
      next.seniorPastorUserId = null;
    }
  }

  await writeAssignments(next);
  return next;
}
