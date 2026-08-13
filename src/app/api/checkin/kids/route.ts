import { NextResponse } from "next/server";
import {
  addKidCheckIn,
  checkoutKid,
  getKidCheckIns,
} from "@/lib/member-server";

function createSecurityCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function GET() {
  const checkins = await getKidCheckIns();
  return NextResponse.json({ checkins });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "checkout") {
    const entry = await checkoutKid(body.id);
    if (!entry) {
      return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
    }
    return NextResponse.json({ checkin: entry });
  }

  const parentName = String(body.parentName ?? "").trim();
  const childName = String(body.childName ?? "").trim();
  const ageGroup = String(body.ageGroup ?? "").trim();
  const service = String(body.service ?? "").trim();

  if (!parentName || !childName || !ageGroup || !service) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const entry = await addKidCheckIn({
    id: `kid-${Date.now()}`,
    parentName,
    childName,
    ageGroup,
    service,
    notes: body.notes ? String(body.notes).trim() : undefined,
    securityCode: createSecurityCode(),
    checkedInAt: new Date().toISOString(),
  });

  return NextResponse.json({ checkin: entry }, { status: 201 });
}
