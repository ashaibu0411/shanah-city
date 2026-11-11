import { GivePageView } from "@/components/give/GivePageView";
import { getTextToGiveConfig } from "@/lib/giving-text";
import { anedotPublicCheckoutAvailable } from "@/lib/anedot-env";
import { listPublicGivingHubMethods } from "@/lib/giving-hub-server";

export const dynamic = "force-dynamic";

export default async function GivePage() {
  const textToGive = getTextToGiveConfig();
  const hub = await listPublicGivingHubMethods();

  return (
    <GivePageView
      textToGive={textToGive}
      hubMethods={hub.methods}
      stripeCheckoutAvailable={hub.stripeCheckoutAvailable}
      anedotCheckoutAvailable={anedotPublicCheckoutAvailable()}
    />
  );
}
