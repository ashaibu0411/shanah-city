import { redirect } from "next/navigation";

/** Consent is handled on the hub; keep route for funnels after journey start. */
export default function MarriageConsentPage() {
  redirect("/marriage");
}
