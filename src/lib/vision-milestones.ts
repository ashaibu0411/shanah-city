import { prisma } from "@/lib/db";

type DraftTask = { kind: string; period: string; title: string; description: string; dueOn: string };

const monthEnd = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
const monthId = (month: number) => "2027-" + String(month).padStart(2, "0");

export function makeVisionMilestoneTemplates(ministryKey: string): DraftTask[] {
  const tasks: DraftTask[] = [];
  for (let month = 1; month <= 12; month++) {
    const period = monthId(month);
    const end = monthEnd(2027, month);
    tasks.push({
      kind: "monthly-direction", period, dueOn: end,
      title: "Review and act on " + period + " ministry priorities",
      description: "Review your approved vision, coordinate the month's priorities and record outcomes using existing ministry reports. This is a leadership checkpoint, not a published event.",
    });
    if (ministryKey === "worship") {
      tasks.push({
        kind: "worship-monthly", period, dueOn: end,
        title: "Shanah Worship: prayer, rehearsal and leadership preparation",
        description: "Review choir devotion and rehearsal preparation, team coverage, Sunday readiness and emerging worship leaders. Track evidence through the existing Worship & Choir monthly report.",
      });
      if (month % 3 === 2) tasks.push({
        kind: "worship-at-the-well", period, dueOn: end,
        title: "Shanah Worship: quarterly Worship at the Well planning",
        description: "Plan the proposed quarterly worship night with pastoral oversight; verify exact date, theme, budget and production through the existing Calendar and Worship tools. This month-end checkpoint is not an actual event date.",
      });
    }
    if (ministryKey === "young-adults") {
      tasks.push({
        kind: "young-monthly", period, dueOn: end,
        title: "Young Adults: Bible study, mentoring and fellowship accountability",
        description: "Review Bible study, spiritual growth, attendance, personal follow-up and mentoring. Record actual participation in the existing Young Adults monthly ministry report.",
      });
      if (month % 3 === 1) tasks.push({
        kind: "young-quarterly-connection", period, dueOn: end,
        title: "Young Adults: quarterly fellowship or service connection",
        description: "Prepare a community, social or service opportunity for this quarter; dates and publication require existing church Calendar approval.",
      });
    }
    if (ministryKey === "kids") {
      tasks.push({
        kind: "kids-monthly", period, dueOn: end,
        title: "Shanah Kids: curriculum, volunteer coverage and safeguarding readiness",
        description: "Review Sunday lesson readiness, adequate adult supervision, authorized pickup processes, volunteer development and aggregate family engagement. Report only nonidentifying metrics; handle child-safety concerns in the established safeguarding process.",
      });
    }
    if (ministryKey === "women") {
      tasks.push({
        kind: "women-monthly", period, dueOn: end,
        title: "Transformed Women: monthly prayer and discipleship connection",
        description: "Plan and facilitate an intentional gathering for prayer, Bible teaching, encouragement or fellowship; invite and follow up with women. Report verified participation through the existing monthly ministry report. This is an accountability deadline, not a confirmed event date.",
      });
      tasks.push({
        kind: "women-sunday", period, dueOn: end,
        title: "Transformed Women: strengthen Sunday worship engagement",
        description: "Connect with inconsistent and new women, listen for participation barriers, coordinate appropriate follow-up and encourage Sunday commitment. Record verified Sunday attendance when available.",
      });
      if (month % 2 === 0) {
        tasks.push({
          kind: "women-bible-brunch", period, dueOn: end,
          title: "Transformed Women: in-person Bible & Brunch",
          description: "Plan the every-other-month Bible & Brunch experience with biblical teaching, community invitations and first-time guest follow-up. Confirm exact gathering dates in the existing Calendar; the end-of-month date is a reporting checkpoint only.",
        });
      }
      tasks.push({
        kind: "women-community-expansion", period, dueOn: end,
        title: "Transformed Women: community outreach and connection",
        description: "Invite women beyond Shanah City, follow up with first-time guests, encourage Bible & Brunch and Sunday participation, and report distinct new connections and emerging women leaders.",
      });
    }
    if (ministryKey === "men") {
      tasks.push({
        kind: "men-prayer", period, dueOn: end,
        title: "Men of Legacy: monthly prayer accountability",
        description: "Plan and deliver this month's men's prayer gathering. Invite men, follow up with absentees and record verified participation. The exact meeting date belongs in the church Calendar.",
      });
      tasks.push({
        kind: "men-sunday", period, dueOn: end,
        title: "Men of Legacy: Sunday attendance engagement",
        description: "Contact inconsistent men, understand barriers, invite them personally and report verified Sunday attendance and engagement actions.",
      });
      if (month % 2 === 1) {
        tasks.push({
          kind: "men-breakfast", period, dueOn: end,
          title: "Men of Legacy: bi-monthly breakfast planning and follow-through",
          description: "Coordinate a structured in-person gathering with teaching, fellowship, accountability and guest follow-up. This is a planning month, not a confirmed event date.",
        });
      }
    }
  }
  for (let quarter = 1; quarter <= 4; quarter++) {
    const month = quarter * 3;
    tasks.push({
      kind: "quarterly-review", period: "2027-Q" + quarter, dueOn: monthEnd(2027, month),
      title: "Q" + quarter + " ministry leadership performance review",
      description: "Review attendance, participation, actions, challenges and development needs with pastoral leadership. Document next-quarter priorities in the existing monthly report and Vision Center discussion.",
    });
  }
  if (ministryKey === "kids") {
    tasks.push(
      {
        kind: "kids-vbs-proposal", period: "2027-vbs-proposal", dueOn: "2027-03-31",
        title: "Shanah Kids: submit June VBS and Kids Sunday proposal",
        description: "Present Bible theme, days, age groups, school-break date options, budget, family outreach, safeguarding, authorized pickup, volunteer plan and proposed Kids Sunday service responsibilities for pastoral approval. March 31 is a proposal checkpoint, not an event date.",
      },
      {
        kind: "kids-vbs-readiness", period: "2027-vbs-readiness", dueOn: "2027-05-31",
        title: "Shanah Kids: confirm VBS readiness and Kids Sunday plan",
        description: "Confirm approved June school-break dates, curriculum, volunteers, child safety procedures, registrations, parent consent, service rehearsal and cross-ministry handoffs. May 31 is a readiness checkpoint only.",
      },
      {
        kind: "kids-vbs-june", period: "2027-06", dueOn: "2027-06-30",
        title: "Shanah Kids: June Vacation Bible School and Kids Sunday Celebration",
        description: "Deliver the approved VBS in June during school vacation and conclude with the agreed Kids Sunday Celebration at the end of that VBS week. Log only aggregate attendance, new families, volunteer participation, completion and appropriate follow-up. June 30 is the reporting deadline, not the specific Sunday date.",
      },
      {
        kind: "kids-vbs-followup", period: "2027-vbs-followup", dueOn: "2027-07-31",
        title: "Shanah Kids: VBS family follow-up and ministry review",
        description: "Review outcomes with pastoral leadership, thank volunteers, connect first-time families and capture improvement actions for the next year without exposing child-identifying data.",
      },
    );
  }
  if (ministryKey === "operations") {
    const sessions = [
      { number: 1, period: "2027-dream-team-1", dueOn: "2027-03-31",
        title: "Dream Team Discipleship 1 — A Disciple Before a Volunteer",
        description: "Host the first in-person Dream Team discipleship training: character, spiritual maturity, Christian example and servant leadership. Submit the actual date and program for pastoral approval. March 31 is an accountability checkpoint, not a published event date." },
      { number: 2, period: "2027-dream-team-2", dueOn: "2027-07-31",
        title: "Dream Team Discipleship 2 — Faithful Stewards of God's House",
        description: "Host the second in-person Dream Team training: prayer, faithfulness, consistency, punctuality, team unity, excellence and caring for people. July 31 is an accountability checkpoint, not a published event date." },
      { number: 3, period: "2027-dream-team-3", dueOn: "2027-11-30",
        title: "Dream Team Discipleship 3 — Disciples Who Multiply",
        description: "Host the third in-person Dream Team training: welcoming guests, follow-up, mentoring volunteers and multiplying leaders. November 30 is an accountability checkpoint, not a published event date." },
    ];
    for (const session of sessions) {
      tasks.push({
        kind: "dream-team-discipleship", period: session.period, dueOn: session.dueOn,
        title: session.title, description: session.description,
      });
    }
    tasks.push({
      kind: "dream-team-discipleship-proposal", period: "2027-dream-team-planning", dueOn: "2027-01-31",
      title: "Dream Team: submit three in-person discipleship training plans",
      description: "Propose the dates, biblical outlines, teaching leaders, participation plan, venue, resources and follow-up actions for all three sessions. Exact dates remain subject to pastoral approval.",
    });
  }
  if (ministryKey === "young-adults") {
    tasks.push({
      kind: "young-remnant-proposal", period: "2027-remnant-proposal", dueOn: "2027-01-31",
      title: "Young Adults: submit proposed Remnant Experience plans",
      description: "Prepare proposed March flagship date, name, agenda, venue, cost, invitations and mentoring/follow-up, all subject to Senior Pastor approval. This date is an internal planning checkpoint, not a public event.",
    });
  }
  if (ministryKey === "women") {
    tasks.push({
      kind: "women-conference-proposal", period: "2027-conference-proposal", dueOn: "2027-02-28",
      title: "Transformed Women: submit Mother's Day conference proposal",
      description: "Present the May 7–9, 2027 conference schedule, proposed speakers, volunteers, community invitation strategy, budget and follow-up plan for pastoral approval. February 28 is a proposal deadline, not an event date.",
    });
  }
  if (ministryKey === "women") {
    tasks.push({
      kind: "women-mothers-day-conference", period: "2027-mothers-day-conference", dueOn: "2027-05-07",
      title: "Transformed Women Conference — Mother's Day Weekend",
      description: "Conference weekend May 7–9, 2027. Confirm event sessions and budget with pastoral oversight, mobilize community invitations and create a post-conference guest follow-up plan. This is the established weekend, not a public calendar listing.",
    });
  }
  if (ministryKey === "men") {
    tasks.push({
      kind: "men-fathers-day", period: "2027-fathers-day", dueOn: "2027-06-18",
      title: "Men of Legacy: Father's Day celebration planning",
      description: "Prepare the June 18–20 Father's Day weekend. Confirm the program, invitations, leaders, guest follow-up and budget with pastoral approval. This does not publish an event.",
    });
  }
  return tasks;
}

/** Assign only to leaders explicitly granted access to an approved plan; safe to retry. */
export async function provisionVisionMilestones(planId: string) {
  const plan = await prisma.visionPlan.findUnique({ where: { id: planId }, include: { assignments: true } });
  if (!plan || plan.status !== "approved" || plan.year !== 2027) return 0;
  const templates = makeVisionMilestoneTemplates(plan.ministryKey);
  const data = plan.assignments.flatMap(assignment => templates.map(template => ({
    planId, assigneeId: assignment.userId, ...template,
  })));
  if (!data.length) return 0;
  const created = await prisma.visionMilestone.createMany({ data, skipDuplicates: true });
  return created.count;
}
