import { photoUsePolicy } from "@/lib/photo-use-policy";

export function PhotoUsePolicyNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 ring-1 ring-amber-900/5">
      <h2 className="font-display text-lg font-semibold text-night-900">
        {photoUsePolicy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-night-700">
        {photoUsePolicy.summary}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-night-600">
        {photoUsePolicy.points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="text-amber-700">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-night-500">
        This is not legal advice. Shanah City should also use photo release forms for
        services and events. Questions: admin@shanahcity.org
      </p>
    </div>
  );
}
