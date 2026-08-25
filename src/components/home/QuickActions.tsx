import Link from "next/link";
import { quickActions } from "@/lib/site";

const actionGradients: Record<string, string> = {
  "/live": "from-red-600 via-rose-600 to-red-800",
  "/devotions": "from-amber-500 via-orange-500 to-orange-600",
  "/connect": "from-blue-600 via-indigo-600 to-indigo-700",
  "/community": "from-emerald-500 via-teal-500 to-teal-600",
  "/give": "from-violet-600 via-purple-600 to-purple-800",
  "/sermons": "from-night-800 via-night-900 to-night-950",
};

export function QuickActions() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {quickActions.map((action) => {
        const gradient =
          actionGradients[action.href] ?? "from-night-800 via-night-900 to-night-950";

        return (
          <Link
            key={action.label}
            href={action.href}
            className={`group flex min-h-[7.5rem] flex-col justify-between rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-app-md ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-app-lg`}
          >
            <span className="text-2xl drop-shadow-sm">{action.icon}</span>
            <p className="text-sm font-semibold leading-tight drop-shadow-sm">
              {action.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
