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
      if (month % 3 === 1) {
        tasks.push({
          kind: "women-quarterly-gathering", period, dueOn: end,
          title: "Transformed Women: quarterly focused fellowship and development",
          description: "Propose a focused teaching, fellowship or spiritual development gathering this quarter. Confirm event details through the existing Calendar after pastoral approval; report outcomes in monthly ministry reports.",
        });
      }
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
  if (ministryKey === "women") {
    tasks.push({
      kind: "women-annual-flagship", period: "2027-flagship-proposal", dueOn: "2027-02-28",
      title: "Transformed Women: submit annual flagship proposal",
      description: "Present the proposed May 2027 annual gathering theme, format, date options, speaker/team needs, outreach plan and budget for pastoral approval. This February deadline is for the proposal, not a confirmed event date.",
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
