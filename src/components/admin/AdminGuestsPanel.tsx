"use client";

import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { GuestQueuePanel } from "@/components/frontliners/GuestQueuePanel";

export function AdminGuestsPanel() {
  return (
    <>
      <AdminSubNav />
      <GuestQueuePanel />
    </>
  );
}
