import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncOutlookChurchCalendar } from "@/lib/outlook-calendar-sync";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncOutlookChurchCalendar();
    revalidatePath("/calendar");
    revalidatePath("/");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Outlook sync failed." },
      { status: 400 },
    );
  }
}
