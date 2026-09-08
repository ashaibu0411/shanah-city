import { redirect } from "next/navigation";

export default function AdminMinistryReportsPage() {
  redirect("/admin/reports?section=leaders");
}
