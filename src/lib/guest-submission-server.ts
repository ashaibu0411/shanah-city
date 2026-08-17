import { useDatabase } from "@/lib/use-database";
import * as guestSubmissionDb from "@/lib/stores/guest-submission-db";
import * as guestSubmissionJson from "@/lib/stores/guest-submission-json";

const store = () => (useDatabase() ? guestSubmissionDb : guestSubmissionJson);

export const listGuestSubmissions = (
  options?: Parameters<typeof guestSubmissionJson.listGuestSubmissions>[0],
) => store().listGuestSubmissions(options);

export const addGuestSubmission = (
  input: Parameters<typeof guestSubmissionJson.addGuestSubmission>[0],
) => store().addGuestSubmission(input);

export const updateGuestSubmission = (
  id: string,
  update: Parameters<typeof guestSubmissionJson.updateGuestSubmission>[1],
) => store().updateGuestSubmission(id, update);
