import { redirect } from "next/navigation";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";

export default function CouplesCommunityPage() {
  redirect(powerCouplesGroupHubPath());
}
