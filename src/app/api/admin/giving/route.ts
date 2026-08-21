import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserById, getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  GIVING_FUND_OPTIONS,
  GIVING_METHOD_OPTIONS,
  givingRecordsToCsv,
  summarizeGivingRecords,
  type GivingFund,
  type GivingMethod,
} from "@/lib/giving-types";
import {
  createGivingRecord,
  deleteGivingRecord,
  listGivingRecords,
  updateGivingRecord,
} from "@/lib/giving-server";
import { sendGivingThankYou } from "@/lib/giving-notify-server";

function parseGivingBody(body: Record<string, unknown>) {
  return {
    userId: body.userId ? String(body.userId).trim() : undefined,
    donorName: String(body.donorName ?? "").trim(),
    donorEmail: body.donorEmail ? String(body.donorEmail).trim() : undefined,
    amount: Number(body.amount),
    fund: String(body.fund ?? "offering") as GivingFund,
    method: String(body.method ?? "other") as GivingMethod,
    givenOn: String(body.givenOn ?? "").trim(),
    campusId: body.campusId ? String(body.campusId).trim() : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
  };
}

function validateGivingInput(input: ReturnType<typeof parseGivingBody>) {
  if (!input.donorName) {
    return "Donor name is required.";
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "Enter a valid amount greater than zero.";
  }
  if (!input.givenOn) {
    return "Gift date is required.";
  }
  if (!GIVING_FUND_OPTIONS.some((option) => option.value === input.fund)) {
    return "Invalid fund category.";
  }
  if (!GIVING_METHOD_OPTIONS.some((option) => option.value === input.method)) {
    return "Invalid giving method.";
  }
  return null;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canManageAsAdmin(user))) {
    return {
      error: NextResponse.json({ error: "Admin Group access required." }, { status: 403 }),
    };
  }

  return { user };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const fund = searchParams.get("fund") ?? undefined;
  const format = searchParams.get("format");

  const records = await listGivingRecords({ since, until, userId, fund });
  const summary = summarizeGivingRecords(records);

  if (format === "csv") {
    const csv = givingRecordsToCsv(records);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shanah-giving-report.csv"`,
      },
    });
  }

  return NextResponse.json({ records, summary });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const input = parseGivingBody(body);
  const validationError = validateGivingInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (input.userId) {
    const member = await getUserById(input.userId);
    if (!member) {
      return NextResponse.json({ error: "Linked member not found." }, { status: 404 });
    }
    input.donorName = input.donorName || member.name;
    input.donorEmail = input.donorEmail || member.email;
    input.campusId = input.campusId || member.campusId;
  }

  const record = await createGivingRecord({
    ...input,
    recordedBy: auth.user!.id,
    recordedByName: auth.user!.name,
  });

  void sendGivingThankYou(record, { id: auth.user!.id }).catch((error) => {
    console.error("Manual giving thank-you failed:", error);
  });

  return NextResponse.json({ record }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const input = parseGivingBody(body);
  const validationError = validateGivingInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const record = await updateGivingRecord(id, input);
  if (!record) {
    return NextResponse.json({ error: "Giving record not found." }, { status: 404 });
  }

  return NextResponse.json({ record });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const removed = await deleteGivingRecord(id);
  if (!removed) {
    return NextResponse.json({ error: "Giving record not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
