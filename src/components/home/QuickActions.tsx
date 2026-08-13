import Link from "next/link";
import { quickActions } from "@/lib/site";

export function QuickActions() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {quickActions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`group rounded-2xl bg-gradient-to-br ${action.color} p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
        >
          <span className="text-2xl">{action.icon}</span>
          <p className="mt-3 text-sm font-semibold leading-tight">
            {action.label}
          </p>
        </Link>
      ))}
    </div>
  );
}
