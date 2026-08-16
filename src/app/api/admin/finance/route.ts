import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canAccessFinance } from "@/lib/finance-access-server";
import {
  financeSheetsToCsv,
  summarizeFinanceSheets,
  type FinanceCountCell,
} from "@/lib/finance-types";
import {
  deleteFinanceSheet,
  getFinanceSheetByWeek,
  listFinanceSheets,
  reopenFinanceSheet,
  saveFinanceSheet,
} from "@/lib/finance-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

function parseLines(body: Record<string, unknown>): FinanceCountCell[] {
  if (!Array.isArray(body.lines)) return [];
  return body.lines
    .map((cell) => ({
      fund: String((cell as FinanceCountCell).fund ?? ""),
      method: String((cell as FinanceCountCell).method ?? ""),
      amount: Number((cell as FinanceCountCell).amount ?? 0),
    }))
    .filter((cell) => cell.fund && cell.method) as FinanceCountCell[];
}

async function requireFinanceAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canAccessFinance(user))) {
    return {
      error: NextResponse.json(
        { error: "Finance Team or Admin Group access required." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET(request: Request) {
  const auth = await requireFinanceAccess();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const weekEnding = searchParams.get("weekEnding");
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;
  const format = searchParams.get("format");

  if (weekEnding) {
    const sheet = await getFinanceSheetByWeek(weekEnding);
    return NextResponse.json({ sheet });
  }

  const sheets = await listFinanceSheets({ since, until });
  const submittedSheets = sheets.filter((sheet) => sheet.status === "submitted");
  const summary = summarizeFinanceSheets(submittedSheets);

  if (format === "csv") {
    const csv = financeSheetsToCsv(sheets);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shanah-finance-weekly-report.csv"`,
      },
    });
  }

  return NextResponse.json({ sheets, summary });
}

export async function POST(request: Request) {
  const auth = await requireFinanceAccess();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");
  const weekEnding = String(body.weekEnding ?? "").trim();

  if (!weekEnding) {
    return NextResponse.json({ error: "Week ending date is required." }, { status: 400 });
  }

  try {
    if (action === "reopen") {
      if (!(await canManageAsAdmin(auth.user!))) {
        return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
      }
      const sheet = await reopenFinanceSheet(weekEnding);
      if (!sheet) {
        return NextResponse.json({ error: "Weekly sheet not found." }, { status: 404 });
      }
      return NextResponse.json({ sheet });
    }

    if (action === "delete") {
      if (!(await canManageAsAdmin(auth.user!))) {
        return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
      }
      const removed = await deleteFinanceSheet(weekEnding);
      if (!removed) {
        return NextResponse.json({ error: "Weekly sheet not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    const lines = parseLines(body);
    const notes = body.notes ? String(body.notes).trim() : undefined;
    const status = action === "submit" ? "submitted" : "draft";

    const sheet = await saveFinanceSheet({
      weekEnding,
      lines,
      notes,
      status,
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({ sheet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save weekly sheet." },
      { status: 400 },
    );
  }
}
