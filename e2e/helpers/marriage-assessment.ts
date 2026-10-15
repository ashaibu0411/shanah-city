import type { APIRequestContext } from "@playwright/test";
import { DEFAULT_BUDGET_LINES } from "../../src/lib/marriage-stage2-content/mod-05-financial";

type Question = {
  id: string;
  type: string;
  required?: boolean;
  allowSkip?: boolean;
  options?: Array<{ id: string; label: string }>;
};

export function minimalAnswersForQuestions(questions: Question[]): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    if (!q.required) continue;
    switch (q.type) {
      case "single_choice":
      case "scenario":
      case "preferred_response":
        answers[q.id] = q.options?.[0]?.id ?? "a";
        break;
      case "multiple_choice":
        answers[q.id] = [q.options?.[0]?.id ?? "opt-1"];
        break;
      case "likert":
      case "agreement":
        answers[q.id] = "4";
        break;
      case "ranking":
      case "priorities":
        answers[q.id] = (q.options ?? []).map((o) => o.id);
        break;
      case "short_answer":
      case "long_reflection":
        answers[q.id] = "E2E synthetic response — not real pastoral content.";
        break;
      case "partner_prediction":
        answers[q.id] = { choice: q.options?.[2]?.id ?? "3" };
        break;
      case "budget_worksheet":
        answers[q.id] = {
          mode: "hypothetical",
          monthlyIncome: 5000,
          lines: DEFAULT_BUDGET_LINES.map((l) => ({
            ...l,
            amount: l.id === "housing" ? 1500 : l.id === "food" ? 600 : 100,
          })),
        };
        break;
      default:
        answers[q.id] = "ok";
    }
  }
  return answers;
}

export async function saveAndSubmitModule(request: APIRequestContext, moduleId: string) {
  const getRes = await request.get(`/api/marriage/assessment/${moduleId}`);
  const assessment = await getRes.json();
  if (!getRes.ok()) {
    throw new Error(assessment.error ?? "assessment load failed");
  }
  const answers = minimalAnswersForQuestions(assessment.module.questions);
  const patch = await request.patch(`/api/marriage/assessment/${moduleId}`, {
    data: { answers },
  });
  if (!patch.ok()) {
    throw new Error((await patch.json()).error ?? "draft save failed");
  }
  const submit = await request.post(`/api/marriage/assessment/${moduleId}`, {
    data: { action: "submit" },
  });
  if (!submit.ok()) {
    throw new Error((await submit.json()).error ?? "submit failed");
  }
}

export async function setupPremaritalJourney(
  partnerA: APIRequestContext,
  partnerB: APIRequestContext,
): Promise<string> {
  const inviteRes = await partnerA.post("/api/marriage/invite", {
    data: { action: "create", programType: "premarital" },
  });
  const inviteBody = await inviteRes.json();
  if (!inviteRes.ok()) throw new Error(inviteBody.error ?? "invite failed");
  const inviteCode = (inviteBody.code ?? inviteBody.invite?.code) as string;
  const journeyId = inviteBody.journey.id as string;
  await partnerA.post("/api/marriage/journey", { data: { action: "consent", journeyId } });
  const acceptRes = await partnerB.post("/api/marriage/invite", {
    data: { action: "accept", code: inviteCode },
  });
  if (!acceptRes.ok()) throw new Error((await acceptRes.json()).error ?? "accept failed");
  await partnerB.post("/api/marriage/journey", { data: { action: "consent", journeyId } });
  return journeyId;
}
