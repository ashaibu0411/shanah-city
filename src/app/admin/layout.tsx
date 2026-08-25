import { AdminPortalShell } from "@/components/admin/AdminPortalShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminPortalShell>{children}</AdminPortalShell>;
}
