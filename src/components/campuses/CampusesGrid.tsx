"use client";

import { campuses } from "@/lib/site";
import { Badge, Card } from "@/components/ui";

export function CampusesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {campuses.map((campus) => (
        <Card key={campus.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-night-900">
                {campus.name}
              </h3>
              <p className="mt-1 text-sm text-night-600">
                {campus.city}, {campus.country}
              </p>
            </div>
            {campus.isLive && (
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live
              </Badge>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-night-600">
            <p>
              <span className="font-semibold text-night-800">Pastor:</span>{" "}
              {campus.pastor}
            </p>
            <p>
              <span className="font-semibold text-night-800">Timezone:</span>{" "}
              {campus.timezone.replace("_", " ")}
            </p>
            <p>
              <span className="font-semibold text-night-800">Services:</span>{" "}
              {campus.serviceTimes.join(" · ")}
            </p>
            {campus.address && (
              <p>
                <span className="font-semibold text-night-800">Address:</span>{" "}
                {campus.address}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
