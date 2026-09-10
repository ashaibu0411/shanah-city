"use client";

import { useMemo, useState } from "react";
import {
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { Button } from "@/components/ui";
import {
  getMinistryReadinessPack,
  passesReadinessQuiz,
  scoreReadinessAnswers,
  type MinistryReadinessPublicPack,
} from "@/lib/ministry-readiness-types";

type MinistryReadinessFlowProps = {
  groupId: string;
  pack: MinistryReadinessPublicPack;
  onCompleted: (requiresLeaderApproval: boolean) => void;
  onCancel?: () => void;
};

export function MinistryReadinessFlow({
  groupId,
  pack,
  onCompleted,
  onCancel,
}: MinistryReadinessFlowProps) {
  const [step, setStep] = useState<"read" | "quiz" | "commit">("read");
  const [hasReadStandards, setHasReadStandards] = useState(false);
  const [hasReadExpectations, setHasReadExpectations] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [agreedShared, setAgreedShared] = useState(false);
  const [agreedTeam, setAgreedTeam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quizError, setQuizError] = useState("");

  const scoringPack = useMemo(() => getMinistryReadinessPack(pack.readinessKey), [pack.readinessKey]);

  const allAnswered = useMemo(
    () => pack.questions.every((question) => typeof answers[question.id] === "number"),
    [answers, pack.questions],
  );

  const canContinueFromRead = hasReadStandards && hasReadExpectations;

  function continueToCommit() {
    setQuizError("");
    const { correct, total } = scoreReadinessAnswers(scoringPack, answers);
    if (!passesReadinessQuiz(correct, total)) {
      setQuizError(
        `You scored ${correct}/${total}. You need at least ${pack.passingScore.required} correct — review the standards and try again.`,
      );
      return;
    }
    setStep("commit");
  }

  async function submit() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/groups/readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, answers, agreed: agreedShared && agreedTeam }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Could not complete readiness.");
      return;
    }

    onCompleted(Boolean(data.requiresLeaderApproval));
  }

  return (
    <GroupPremiumStackCard>
      <GroupPremiumSectionLabel>Before you serve</GroupPremiumSectionLabel>
      <h2 className={`${groupsPremium.cardTitle} mt-2`}>{pack.title}</h2>
      <p className={`${groupsPremium.cardMeta} mt-2`}>{pack.subtitle}</p>
      <p className="mt-3 rounded-xl bg-[#f7f3eb]/80 px-3 py-2 text-xs leading-relaxed text-night-600 ring-1 ring-night-900/8">
        This short orientation is for new volunteers joining through the app. If you are already
        on the team, ask your leader to add you instead — you will not need to complete this.
      </p>

      {step === "read" ? (
        <>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
              Shanah ministry standards
            </p>
            <p className="mt-1 text-sm text-night-600">
              These apply to every team you serve on.
            </p>
            <ul className="mt-3 space-y-2">
              {pack.sharedStandards.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl bg-white/70 px-3.5 py-3 text-sm leading-relaxed text-night-700 ring-1 ring-night-900/8"
                >
                  {item}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-start gap-2 text-sm text-night-700">
              <input
                type="checkbox"
                checked={hasReadStandards}
                onChange={(event) => setHasReadStandards(event.target.checked)}
                className="mt-1"
              />
              <span>I have read the Shanah ministry standards.</span>
            </label>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
              Team expectations
            </p>
            <ul className="mt-3 space-y-2">
              {pack.expectations.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl bg-[#f7f3eb]/80 px-3.5 py-3 text-sm leading-relaxed text-night-700 ring-1 ring-night-900/8"
                >
                  {item}
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-start gap-2 text-sm text-night-700">
              <input
                type="checkbox"
                checked={hasReadExpectations}
                onChange={(event) => setHasReadExpectations(event.target.checked)}
                className="mt-1"
              />
              <span>I have read these team expectations.</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {onCancel ? (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button disabled={!canContinueFromRead} onClick={() => setStep("quiz")}>
              Continue to quiz
            </Button>
          </div>
        </>
      ) : null}

      {step === "quiz" ? (
        <>
          <p className="mt-4 rounded-xl bg-[#f7f3eb]/80 px-3 py-2 text-sm text-night-700 ring-1 ring-night-900/8">
            Answer each question from what you read. You need at least{" "}
            <strong>
              {pack.passingScore.required} of {pack.passingScore.total}
            </strong>{" "}
            correct to continue.
          </p>
          <div className="mt-4 space-y-4">
            {pack.questions.map((question) => (
              <fieldset
                key={question.id}
                className="rounded-2xl bg-[#f7f3eb]/50 px-3.5 py-3 ring-1 ring-night-900/8"
              >
                <legend className="text-sm font-semibold text-night-900">{question.prompt}</legend>
                <div className="mt-2 space-y-2">
                  {question.options.map((option, index) => (
                    <label key={option} className="flex items-start gap-2 text-sm text-night-700">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === index}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: index }))
                        }
                        className="mt-1"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {quizError ? <p className="mt-3 text-sm text-red-700">{quizError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep("read")}>
              Back
            </Button>
            <Button disabled={!allAnswered} onClick={continueToCommit}>
              Check answers
            </Button>
          </div>
        </>
      ) : null}

      {step === "commit" ? (
        <>
          <p className="mt-4 text-sm font-medium text-night-900">Sign your commitment</p>
          <p className="mt-1 text-sm text-night-600">
            By checking both boxes below, you agree to serve according to these standards.
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm text-night-700">
            <input
              type="checkbox"
              checked={agreedShared}
              onChange={(event) => setAgreedShared(event.target.checked)}
              className="mt-1"
            />
            <span>{pack.sharedCommitmentLabel}</span>
          </label>
          <label className="mt-3 flex items-start gap-2 text-sm text-night-700">
            <input
              type="checkbox"
              checked={agreedTeam}
              onChange={(event) => setAgreedTeam(event.target.checked)}
              className="mt-1"
            />
            <span>{pack.commitmentLabel}</span>
          </label>
          {pack.requiresLeaderApproval ? (
            <p className="mt-3 text-sm text-night-600">
              After you finish, your request will be sent to the ministry leader for approval.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep("quiz")}>
              Back
            </Button>
            <Button disabled={!agreedShared || !agreedTeam || busy} onClick={submit}>
              {busy
                ? "Saving…"
                : pack.requiresLeaderApproval
                  ? "Submit & request to join"
                  : "Complete & join team"}
            </Button>
          </div>
        </>
      ) : null}
    </GroupPremiumStackCard>
  );
}
