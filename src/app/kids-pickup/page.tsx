import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getKidCheckIns } from "@/lib/member-server";

export const dynamic = "force-dynamic";

export default async function KidsPickupPage() {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/sign-in?next=/kids-pickup");

  // Only the linked guardian can retrieve their own pickup codes.
  const entries = (await getKidCheckIns())
    .filter((entry) => entry.parentUserId === user.id)
    .sort((a, b) => Date.parse(b.checkedInAt) - Date.parse(a.checkedInAt))
    .slice(0, 20);
  const active = entries.filter((entry) => !entry.checkedOutAt);

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">Shanah Kids</p>
        <h1 className="mt-2 text-3xl font-bold">My Kids · Pickup Pass</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your active pickup passes are saved here while your children are checked in. Open this page again from your check-in notification whenever needed. Show the code to an authorized teacher at pickup.
          Staff must also verify the pickup adult's identity.
        </p>
      </header>
      {active.length === 0 ? (
        <section className="rounded-2xl border p-5">No children are currently checked in under this account.</section>
      ) : active.map((entry) => (
        <section key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
          <h2 className="text-xl font-bold">{entry.childName}</h2>
          <p className="mt-1 text-sm">{entry.ageGroup} · {entry.service}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest">Private pickup code</p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-[0.15em]">{entry.securityCode}</p>
          <p className="mt-3 text-sm">Do not share this code publicly.</p>
        </section>
      ))}
      {entries.some((entry) => entry.checkedOutAt) && (
        <p className="text-sm text-slate-600 dark:text-slate-300">Past visits are shown below for your records. Pickup codes expire at checkout.</p>
      )}
      {entries.filter(entry=>entry.checkedOutAt).map(entry=><section key={entry.id} className="rounded-xl border p-4"><h2 className="font-semibold">{entry.childName} · Checked out</h2><p className="text-sm text-slate-600">{entry.ageGroup} · {entry.service}</p><p className="text-xs text-slate-500">Checked in: {new Date(entry.checkedInAt).toLocaleString()} · Checked out: {entry.checkedOutAt?new Date(entry.checkedOutAt).toLocaleString():""}</p></section>)}
    </main>
  );
}
