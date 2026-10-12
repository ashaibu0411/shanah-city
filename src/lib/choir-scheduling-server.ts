/**
 * Shared scheduling access for Shanah Worship (group-choir).
 *
 * Authoritative service plans & roster: `listWorshipPlans` (Postgres when DATABASE_URL is set, else JSON).
 * Calendar events: worship plans + group-linked church events (`buildChoirCalendarPagePayload`).
 * Availability responses & change requests: `data/choir-availability.json`.
 *
 * Member identity: session user id === group member id === assignment `userId` on worship plans.
 */
export { buildChoirCalendarPagePayload } from "@/lib/choir-calendar-server";
export { listChoirMemberAssignments } from "@/lib/choir-team-server";
export {
  buildChoirAvailabilityHomePayload,
  buildChoirMySchedulePayload,
  getChoirAvailabilitySchedulePayload,
  listChoirAvailabilityOpportunities,
  buildChoirAvailabilityCalendarMonth,
} from "@/lib/choir-availability-server";
