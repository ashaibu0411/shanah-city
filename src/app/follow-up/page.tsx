import { redirect } from "next/navigation";
import { FOLLOW_UP_GROUP_ID } from "@/lib/follow-up-types";

export default function FollowUpRedirectPage() {
  redirect(`/groups/${FOLLOW_UP_GROUP_ID}?guests=1`);
}
