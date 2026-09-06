import { recordActivity, getUserById } from "@/lib/auth-server";
import { COMMS_REQUEST_STATUSES } from "@/lib/comms-constants";
import type { CommsRequest, CommsRequestStatus } from "@/lib/comms-types";
import { sendCommsRequestUpdateEmail } from "@/lib/email-server";
import { sendPushToUsers } from "@/lib/push-server";
import { getAppBaseUrl } from "@/lib/share-urls";

const NOTIFY_STATUSES: CommsRequestStatus[] = [
  "approved",
  "on_hold",
  "in_progress",
  "done",
];

function statusLabel(status: CommsRequestStatus) {
  return COMMS_REQUEST_STATUSES.find((entry) => entry.id === status)?.label ?? status;
}

function buildStatusMessage(request: CommsRequest) {
  return `Your comms request "${request.title}" is now ${statusLabel(request.status).toLowerCase()}.`;
}

export async function notifyCommsRequestStatusChange(
  request: CommsRequest,
  previousStatus: CommsRequestStatus,
) {
  if (request.status === previousStatus) return;
  if (!NOTIFY_STATUSES.includes(request.status)) return;

  const message = buildStatusMessage(request);
  await deliverCommsRequestUpdate(request, {
    title: "Comms request update",
    message,
  });
}

export async function notifyCommsRequestPublished(request: CommsRequest) {
  const message = `Your comms request "${request.title}" was published to the app (banner, community, and/or push).`;
  await deliverCommsRequestUpdate(request, {
    title: "Comms request published",
    message,
  });
}

async function deliverCommsRequestUpdate(
  request: CommsRequest,
  input: { title: string; message: string },
) {
  await recordActivity(request.requesterId, "comms_request_update", input.message);

  const requester = await getUserById(request.requesterId);
  if (requester?.email) {
    await sendCommsRequestUpdateEmail({
      to: requester.email,
      name: requester.name,
      requestTitle: request.title,
      message: input.message,
      profileUrl: `${getAppBaseUrl()}/profile`,
      requestsUrl: `${getAppBaseUrl()}/comms/request`,
    });
  }

  await sendPushToUsers(
    [request.requesterId],
    {
      title: input.title,
      body: input.message.slice(0, 180),
      url: "/comms/request",
    },
    "announcements",
  );
}
