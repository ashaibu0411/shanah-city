import { MemberProfile } from "@/components/auth/MemberProfile";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";

export default function ProfilePage() {
  return (
    <>
      <MarkFeedRead feed="kids" />
      <MemberProfile />
    </>
  );
}
