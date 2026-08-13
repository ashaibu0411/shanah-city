import { NextResponse } from "next/server";
import {
  addUnavailabilityRequest,
  getUnavailabilityRequests,
  updateUnavailabilityRequest,
  verifyLeaderPin,
} from "@/lib/member-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");

  let requests = await getUnavailabilityRequests();
  if (group === "choir" || group === "pastors") {
    requests = requests.filter((item) => item.group === group);
  }

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "review") {
    if (!verifyLeaderPin(String(body.pin ?? ""))) {
      return NextResponse.json({ error: "Invalid leader PIN." }, { status: 401 });
    }

    const updated = await updateUnavailabilityRequest(body.id, {
      status: body.status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: body.reviewedBy ?? "Leader",
    });

    if (!updated) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json({ request: updated });
  }

  const personName = String(body.personName ?? "").trim();
  const group = body.group;
  const startDate = String(body.startDate ?? "");
  const endDate = String(body.endDate ?? "");
  const reason = String(body.reason ?? "").trim();

  if (!personName || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (group !== "choir" && group !== "pastors") {
    return NextResponse.json({ error: "Invalid group." }, { status: 400 });
  }

  const item = await addUnavailabilityRequest({
    id: String(Date.now()),
    personName,
    group,
    startDate,
    endDate,
    reason,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ request: item }, { status: 201 });
}
