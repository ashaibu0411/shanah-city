import { AdminSectionChrome } from "@/components/admin/AdminSectionChrome";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSectionChrome>{children}</AdminSectionChrome>;
}
