import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  buildCounselorPremaritalOperationsView,
  cancelPremaritalAppointment,
  reschedulePremaritalAppointment,
  savePremaritalReadinessReview,
  savePremaritalSessionClinicalRecord,
  saveSupplementaryClinicalRecord,
  schedulePremaritalAppointment,
  scheduleSupplementaryAppointment,
} from "@/lib/marriage-premarital-operations-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import type { MarriagePremaritalReadinessStatus } from "@/lib/marriage-counseling-types";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const journeyId = new URL(request.url).searchParams.get("journeyId")?.trim();
  if (!journeyId) return NextResponse.json({ error: "journeyId required." }, { status: 400 });

  try {
    const view = await buildCounselorPremaritalOperationsView(user, journeyId);
    if (!view) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ operations: view });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "schedule_appointment") {
      const session = await schedulePremaritalAppointment(user, {
        journeyId: String(body.journeyId ?? ""),
        premaritalSessionKey: String(body.premaritalSessionKey ?? ""),
        scheduledAtLocal: String(body.scheduledAtLocal ?? ""),
        scheduledEndAtLocal: body.scheduledEndAtLocal ? String(body.scheduledEndAtLocal) : undefined,
        schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
        meetingMode: body.meetingMode as "in_person" | "phone" | "video",
        locationOrLink: body.locationOrLink ? String(body.locationOrLink) : undefined,
        topic: body.topic ? String(body.topic) : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }
    if (action === "reschedule_appointment") {
      const session = await reschedulePremaritalAppointment(user, String(body.sessionId ?? ""), {
        scheduledAtLocal: body.scheduledAtLocal ? String(body.scheduledAtLocal) : undefined,
        scheduledEndAtLocal: body.scheduledEndAtLocal ? String(body.scheduledEndAtLocal) : undefined,
        schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
        meetingMode: body.meetingMode,
        locationOrLink: body.locationOrLink ? String(body.locationOrLink) : undefined,
        reason: body.reason ? String(body.reason) : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }
    if (action === "cancel_appointment") {
      const session = await cancelPremaritalAppointment(
        user,
        String(body.sessionId ?? ""),
        String(body.cancelReason ?? ""),
      );
      return NextResponse.json({ ok: true, session });
    }
    if (action === "save_clinical_record") {
      const record = await savePremaritalSessionClinicalRecord(user, {
        journeyId: String(body.journeyId ?? ""),
        sessionKey: String(body.sessionKey ?? ""),
        sessionDateLocal: body.sessionDateLocal ? String(body.sessionDateLocal) : undefined,
        schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
        partnerAAttended: body.partnerAAttended,
        partnerBAttended: body.partnerBAttended,
        outcome: body.outcome,
        topicsCovered: body.topicsCovered ? String(body.topicsCovered) : undefined,
        followUpActions: body.followUpActions ? String(body.followUpActions) : undefined,
        privateObservations: body.privateObservations ? String(body.privateObservations) : undefined,
        linkedAppointmentId: body.linkedAppointmentId ? String(body.linkedAppointmentId) : undefined,
      });
      return NextResponse.json({ ok: true, record });
    }
    if (action === "save_readiness_review") {
      const record = await savePremaritalReadinessReview(user, {
        journeyId: String(body.journeyId ?? ""),
        status: body.status as MarriagePremaritalReadinessStatus,
        strengths: body.strengths ? String(body.strengths) : undefined,
        areasForDiscussion: body.areasForDiscussion ? String(body.areasForDiscussion) : undefined,
        unresolvedConcerns: body.unresolvedConcerns ? String(body.unresolvedConcerns) : undefined,
        recommendedNextSteps: body.recommendedNextSteps ? String(body.recommendedNextSteps) : undefined,
        optionalAdditionalCounseling: body.optionalAdditionalCounseling
          ? String(body.optionalAdditionalCounseling)
          : undefined,
        pastoralRecommendation: body.pastoralRecommendation
          ? String(body.pastoralRecommendation)
          : undefined,
        sessionsOverviewNote: body.sessionsOverviewNote ? String(body.sessionsOverviewNote) : undefined,
        homeworkOverviewNote: body.homeworkOverviewNote ? String(body.homeworkOverviewNote) : undefined,
        assessmentOverviewNote: body.assessmentOverviewNote
          ? String(body.assessmentOverviewNote)
          : undefined,
      });
      return NextResponse.json({ ok: true, record });
    }
    if (action === "schedule_supplementary_appointment") {
      const session = await scheduleSupplementaryAppointment(user, {
        journeyId: String(body.journeyId ?? ""),
        scheduledAtLocal: String(body.scheduledAtLocal ?? ""),
        scheduledEndAtLocal: body.scheduledEndAtLocal ? String(body.scheduledEndAtLocal) : undefined,
        schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
        meetingMode: body.meetingMode as "in_person" | "phone" | "video",
        locationOrLink: body.locationOrLink ? String(body.locationOrLink) : undefined,
        topic: body.topic ? String(body.topic) : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }
    if (action === "save_supplementary_clinical") {
      const record = await saveSupplementaryClinicalRecord(user, {
        journeyId: String(body.journeyId ?? ""),
        appointmentId: String(body.appointmentId ?? ""),
        sessionDateLocal: body.sessionDateLocal ? String(body.sessionDateLocal) : undefined,
        schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
        partnerAAttended: body.partnerAAttended,
        partnerBAttended: body.partnerBAttended,
        topicsCovered: body.topicsCovered ? String(body.topicsCovered) : undefined,
        followUpActions: body.followUpActions ? String(body.followUpActions) : undefined,
        privateObservations: body.privateObservations
          ? String(body.privateObservations)
          : undefined,
      });
      return NextResponse.json({ ok: true, record });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
