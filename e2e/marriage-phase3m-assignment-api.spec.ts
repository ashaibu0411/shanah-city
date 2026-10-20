import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./helpers/e2e-isolated-data";
import { resetMarriageE2eState } from "./helpers/e2e-isolated-data";
import { newAuthedRequest } from "./helpers/marriage-auth";
import {
  assertNoClinicalLeak,
  assignCoordinator,
  createConsentedPremaritalJourney,
  getAssignmentView,
  seedPrivateAssessmentAnswer,
  expectCounselorClinicalAccess,
  submitCounselorRequest,
} from "./helpers/phase3m-assignment";

test.beforeEach(async () => {
  await resetMarriageE2eState();
});

test.describe("Phase 3M counselor assignment — authenticated API authorization", () => {
  test("authorization matrix, privacy, pending inactive, journeyId substitution", async ({
    playwright,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const sp = await newAuthedRequest(playwright, baseURL!, "seniorPastor");
    const adminA = await newAuthedRequest(playwright, baseURL!, "adminA");
    const adminB = await newAuthedRequest(playwright, baseURL!, "adminB");
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const counselor = await newAuthedRequest(playwright, baseURL!, "counselor");
    const member = await newAuthedRequest(playwright, baseURL!, "member");
    const anon = await playwright.request.newContext({ baseURL: baseURL! });

    const { journeyId: journeyOne } = await createConsentedPremaritalJourney(partnerA, partnerB);

    await seedPrivateAssessmentAnswer(partnerA);

    await assignCoordinator(sp, journeyOne, E2E_USERS.adminA.id);

    // 1 — Senior Pastor coordinator + approval views
    for (const view of [
      "administrative_coordinators",
      "eligible_assignment_admins",
      "senior_pastor_pending",
      "senior_pastor_history",
      "admin_journeys",
    ] as const) {
      const { res } = await getAssignmentView(sp, view);
      expect(res.ok(), view).toBeTruthy();
    }

    // 10 — No clinical leak in administrative responses
    const coordView = await getAssignmentView<{ rows: unknown[] }>(sp, "administrative_coordinators");
    assertNoClinicalLeak(coordView.body);
    const adminJourneysSp = await getAssignmentView<{ rows: unknown[] }>(sp, "admin_journeys");
    assertNoClinicalLeak(adminJourneysSp.body);

    // 2 — Admin A scoped roster
    const adminARoster = await getAssignmentView<{ rows: Array<{ journeyId: string }> }>(
      adminA,
      "admin_journeys",
    );
    expect(adminARoster.res.ok()).toBeTruthy();
    expect(adminARoster.body.rows?.map((r) => r.journeyId)).toEqual([journeyOne]);

    // 3 — Admin B cannot access Admin A couple
    const adminBOnOne = await getAssignmentView(adminB, "", journeyOne);
    expect(adminBOnOne.res.status()).toBe(403);
    expect(adminBOnOne.body.error).toMatch(/Not authorized for this couple/i);

    const submitB = await adminB.post("/api/marriage/counselor/assignment-requests", {
      data: {
        action: "submit",
        journeyId: journeyOne,
        counselorUserId: E2E_USERS.counselor.id,
        requestType: "assign",
      },
    });
    expect(submitB.status()).toBeGreaterThanOrEqual(400);

    // 4 — Ordinary member denied administrative views
    const memberCaps = await getAssignmentView<{ canAccessAdminPage: boolean }>(member, "capabilities");
    expect(memberCaps.res.ok()).toBeTruthy();
    expect(memberCaps.body.canAccessAdminPage).toBe(false);
    const memberAdmin = await getAssignmentView(member, "admin_journeys");
    expect(memberAdmin.res.status()).toBe(403);

    // 5 — Admin cannot approve
    const requestId = await submitCounselorRequest(
      adminA,
      journeyOne,
      E2E_USERS.counselor.id,
      "assign",
    );
    const approveAdmin = await adminA.post("/api/marriage/counselor/assignment-requests", {
      data: { action: "approve", requestId },
    });
    expect(approveAdmin.status()).toBeGreaterThanOrEqual(400);

    // 6 — Admin cannot assign/remove coordinators
    const assignByAdmin = await adminA.post("/api/marriage/counselor/assignment-requests", {
      data: {
        action: "assign_administrative_coordinator",
        journeyId: journeyOne,
        coordinatorUserId: E2E_USERS.adminA.id,
      },
    });
    expect(assignByAdmin.status()).toBeGreaterThanOrEqual(400);
    const removeByAdmin = await adminA.post("/api/marriage/counselor/assignment-requests", {
      data: { action: "remove_administrative_coordinator", journeyId: journeyOne },
    });
    expect(removeByAdmin.status()).toBeGreaterThanOrEqual(400);

    // 9 — Pending does not activate counselor clinical access
    await expectCounselorClinicalAccess(counselor, journeyOne, false);

    // 8 — journeyId substitution: fabricate id with no coordinator assignment
    const adminAOnFake = await getAssignmentView(adminA, "", "mj-nonexistent-phase3m-e2e");
    expect(adminAOnFake.res.status()).toBeGreaterThanOrEqual(400);
    expect(adminAOnFake.body.error).toMatch(/Not authorized|Journey not found/i);

    // 7 — SP reassign / remove on same journey
    await sp.post("/api/marriage/counselor/assignment-requests", {
      data: {
        action: "assign_administrative_coordinator",
        journeyId: journeyOne,
        coordinatorUserId: E2E_USERS.adminB.id,
      },
    });
    const rosterB = await getAssignmentView<{ rows: Array<{ journeyId: string }> }>(
      adminB,
      "admin_journeys",
    );
    expect(rosterB.body.rows?.some((r) => r.journeyId === journeyOne)).toBeTruthy();
    const adminAAfterReassign = await getAssignmentView<{ rows: unknown[] }>(adminA, "admin_journeys");
    expect(adminAAfterReassign.body.rows?.length ?? 0).toBe(0);

    await sp.post("/api/marriage/counselor/assignment-requests", {
      data: { action: "remove_administrative_coordinator", journeyId: journeyOne },
    });
    const adminBAfterRemove = await getAssignmentView<{ rows: unknown[] }>(adminB, "admin_journeys");
    expect(adminBAfterRemove.body.rows?.length ?? 0).toBe(0);

    // Anonymous denied
    const anonRes = await anon.get(
      "/api/marriage/counselor/assignment-requests?view=capabilities",
    );
    expect(anonRes.status()).toBe(401);
  });
});
