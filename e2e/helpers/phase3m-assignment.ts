import { expect, type APIRequestContext } from "@playwright/test";

const SECRET_MARKER = "phase3m-e2e-clinical-secret-marker";

export { SECRET_MARKER };

export async function createConsentedPremaritalJourney(
  partnerA: APIRequestContext,
  partnerB: APIRequestContext,
): Promise<{ journeyId: string; inviteCode: string }> {
  const inviteRes = await partnerA.post("/api/marriage/invite", {
    data: { action: "create", programType: "premarital" },
  });
  const inviteBody = await inviteRes.json();
  expect(inviteRes.ok(), inviteBody.error).toBeTruthy();
  const inviteCode = (inviteBody.code ?? inviteBody.invite?.code) as string;
  const journeyId = inviteBody.journey.id as string;

  await partnerA.post("/api/marriage/journey", { data: { action: "consent", journeyId } });
  const acceptRes = await partnerB.post("/api/marriage/invite", {
    data: { action: "accept", code: inviteCode },
  });
  expect(acceptRes.ok(), (await acceptRes.json()).error).toBeTruthy();
  await partnerB.post("/api/marriage/journey", { data: { action: "consent", journeyId } });

  return { journeyId, inviteCode };
}

export async function seedPrivateAssessmentAnswer(
  partnerA: APIRequestContext,
  moduleId = "mod-01-knowing-yourself",
) {
  const aAssessment = await partnerA.get(`/api/marriage/assessment/${moduleId}`);
  const aData = await aAssessment.json();
  expect(aAssessment.ok()).toBeTruthy();
  const questionId =
    aData.module.questions.find((q: { id: string }) => q.id === "kyp-recharge")?.id ??
    aData.module.questions[0]?.id;
  expect(questionId).toBeTruthy();
  await partnerA.patch(`/api/marriage/assessment/${moduleId}`, {
    data: { answers: { [questionId]: SECRET_MARKER } },
  });
  return { moduleId, questionId };
}

export async function getAssignmentView<T>(
  ctx: APIRequestContext,
  view: string,
  journeyId?: string,
): Promise<{ res: import("@playwright/test").APIResponse; body: T & { error?: string } }> {
  const qs = journeyId
    ? `journeyId=${encodeURIComponent(journeyId)}`
    : `view=${encodeURIComponent(view)}`;
  const url = journeyId
    ? `/api/marriage/counselor/assignment-requests?${qs}`
    : `/api/marriage/counselor/assignment-requests?view=${encodeURIComponent(view)}`;
  const res = await ctx.get(url);
  const body = (await res.json()) as T & { error?: string };
  return { res, body };
}

export function assertNoClinicalLeak(payload: unknown) {
  expect(JSON.stringify(payload)).not.toContain(SECRET_MARKER);
  expect(JSON.stringify(payload)).not.toMatch(/answersJson|"answer":/);
}

export async function assignCoordinator(
  sp: APIRequestContext,
  journeyId: string,
  coordinatorUserId: string,
) {
  const res = await sp.post("/api/marriage/counselor/assignment-requests", {
    data: {
      action: "assign_administrative_coordinator",
      journeyId,
      coordinatorUserId,
    },
  });
  const body = await res.json();
  expect(res.ok(), body.error).toBeTruthy();
}

/** Clinical journey access (assigned counselor). Unassigned/revoked-off-roster → 403. */
export async function expectCounselorClinicalAccess(
  counselor: APIRequestContext,
  journeyId: string,
  allowed: boolean,
) {
  const res = await counselor.get(
    `/api/marriage/counselor/journey/${encodeURIComponent(journeyId)}`,
  );
  const body = await res.json();
  if (allowed) {
    expect(res.ok(), body.error).toBeTruthy();
    expect(body.access).toBe("clinical");
  } else {
    expect(res.status(), body.error ?? JSON.stringify(body)).toBe(403);
    expect(String(body.error ?? "")).toMatch(/Access denied/i);
  }
}

/** Assigned counselor may open clinical detail; individual answers stay withheld without consent. */
export async function expectCounselorJourneyWithheldAnswers(
  counselor: APIRequestContext,
  journeyId: string,
) {
  const res = await counselor.get(
    `/api/marriage/counselor/journey/${encodeURIComponent(journeyId)}`,
  );
  const body = await res.json();
  expect(res.ok(), body.error).toBeTruthy();
  expect(body.access).toBe("clinical");
  assertNoClinicalLeak(body);
  if (Array.isArray(body.authorizedAnswers)) {
    for (const row of body.authorizedAnswers) {
      expect(row.withheld).toBe(true);
    }
  }
}

export async function submitCounselorRequest(
  admin: APIRequestContext,
  journeyId: string,
  counselorUserId: string,
  requestType: "assign" | "reassign" | "remove" = "assign",
) {
  const res = await admin.post("/api/marriage/counselor/assignment-requests", {
    data: {
      action: "submit",
      journeyId,
      counselorUserId,
      requestType,
    },
  });
  const body = await res.json();
  expect(res.ok(), body.error).toBeTruthy();
  return body.request?.id as string;
}
