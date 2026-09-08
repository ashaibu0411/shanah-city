import { GivePageView } from "@/components/give/GivePageView";
import { getTextToGiveConfig } from "@/lib/giving-text";
import { givingPlatforms } from "@/lib/giving-links";

export default function GivePage() {
  const textToGive = getTextToGiveConfig();

  return <GivePageView textToGive={textToGive} platforms={givingPlatforms} />;
}
