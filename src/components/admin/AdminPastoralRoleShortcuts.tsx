import Link from "next/link";
import { Card } from "@/components/ui";
import {
  ASSOCIATE_PASTOR_GROUP_ID,
  SENIOR_PASTOR_GROUP_ID,
} from "@/lib/church-groups";

const ROLE_GROUPS = [
  {
    id: SENIOR_PASTOR_GROUP_ID,
    label: "Senior Pastor",
    description: "Review leader reports and ministry accountability.",
  },
  {
    id: ASSOCIATE_PASTOR_GROUP_ID,
    label: "Associate Pastor",
    description: "Ministry management access for assistant pastors.",
  },
] as const;

export function AdminPastoralRoleShortcuts({ className = "" }: { className?: string }) {
  return (
    <Card className={`${className} border-violet-200/60 bg-violet-50/40`}>
      <h3 className="font-display text-lg font-semibold text-night-900">Pastoral role groups</h3>
      <p className="mt-1 text-sm text-night-600">
        Add or remove Senior and Associate Pastor access. These roles can review leader reports but
        not full admin tools.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ROLE_GROUPS.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="rounded-xl bg-white px-4 py-3 ring-1 ring-night-900/10 transition hover:ring-violet-300"
          >
            <p className="font-semibold text-night-900">{group.label}</p>
            <p className="mt-1 text-xs leading-snug text-night-600">{group.description}</p>
            <p className="mt-2 text-xs font-semibold text-violet-800">Manage members →</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
