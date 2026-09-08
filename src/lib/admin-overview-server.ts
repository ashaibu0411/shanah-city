import { getUsers } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canAccessFinance } from "@/lib/finance-access-server";
import { listCommsRequests } from "@/lib/comms-server";
import { isPendingCommsApproval } from "@/lib/comms-approval";
import { getGroups } from "@/lib/group-server";
import { listGuestSubmissions } from "@/lib/guest-submission-server";
import { listGivingRecords } from "@/lib/giving-server";
import { summarizeGivingRecords } from "@/lib/giving-types";
import { canReviewMinistryReports } from "@/lib/ministry-report-access-server";
import { summarizeMinistryReports } from "@/lib/ministry-report-server";
import { currentReportMonth } from "@/lib/ministry-report-types";
import { getVolunteerCheckIns, getKidCheckIns } from "@/lib/member-server";
import { canAccessKidsMinistry } from "@/lib/kids-access-server";
import { buildHeadcount, filterActiveCheckIns } from "@/lib/kids-server";
import type { PublicMember } from "@/lib/auth-types";

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const toIso = (value: Date) => value.toISOString().slice(0, 10);
  return { since: toIso(start), until: toIso(end), label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
}

function isToday(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

export async function buildAdminOverview(user: PublicMember) {
  const [isAdmin, isPastoral, canFinance, canKids] = await Promise.all([
    canManageAsAdmin(user),
    canReviewMinistryReports(user),
    canAccessFinance(user),
    canAccessKidsMinistry(user),
  ]);

  if (!isAdmin && !isPastoral) {
    return null;
  }

  const month = monthBounds();
  const overview: Record<string, unknown> = {
    monthLabel: month.label,
    generatedAt: new Date().toISOString(),
  };

  if (isAdmin || isPastoral) {
    const guests = await listGuestSubmissions();
    overview.guests = {
      total: guests.length,
      new: guests.filter((guest) => guest.status === "new").length,
      contacted: guests.filter((guest) => guest.status === "contacted").length,
      thisMonth: guests.filter((guest) => guest.submittedAt.slice(0, 7) === month.since.slice(0, 7)).length,
    };

    const users = await getUsers();
    overview.people = {
      total: users.length,
      newThisMonth: users.filter((member) => member.createdAt.slice(0, 7) === month.since.slice(0, 7)).length,
    };

    const groups = await getGroups();
    overview.groups = {
      total: groups.length,
      members: groups.reduce((sum, group) => sum + group.memberIds.length, 0),
    };

    const volunteerCheckIns = await getVolunteerCheckIns();
    overview.volunteersToday = volunteerCheckIns.filter((entry) => isToday(entry.checkedInAt)).length;
  }

  if (isAdmin) {
    overview.ministryReports = await summarizeMinistryReports(currentReportMonth());
  }

  if (canFinance) {
    const records = await listGivingRecords({ since: month.since, until: month.until });
    overview.giving = summarizeGivingRecords(records);
  }

  if (isAdmin) {
    const requests = await listCommsRequests();
    overview.comms = {
      pendingApproval: requests.filter((request) => isPendingCommsApproval(request)).length,
      inProgress: requests.filter((request) => request.status === "in_progress").length,
    };
  }

  if (canKids) {
    const active = filterActiveCheckIns(await getKidCheckIns());
    const headcount = buildHeadcount(active);
    overview.kids = {
      checkedIn: headcount.reduce((sum, room) => sum + room.count, 0),
      rooms: headcount,
    };
  }

  return overview;
}
