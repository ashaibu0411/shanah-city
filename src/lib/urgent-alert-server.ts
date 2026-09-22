import { useDatabase } from "@/lib/use-database";
import { isUrgentAlertPubliclyViewable } from "@/lib/urgent-alert-utils";
import * as urgentAlertDb from "@/lib/stores/urgent-alert-db";
import * as urgentAlertJson from "@/lib/stores/urgent-alert-json";

const store = () => (useDatabase() ? urgentAlertDb : urgentAlertJson);

export const listUrgentAlerts = () => store().listUrgentAlerts();
export const getActiveUrgentAlert = () => store().getActiveUrgentAlert();
export const listVisibleUrgentAlerts = () => store().listVisibleUrgentAlerts();
export const listUrgentAlertsForHomeCarousel = () => store().listUrgentAlertsForHomeCarousel();
export const getFlaggedUrgentAlert = () => store().getFlaggedUrgentAlert();
export const getUrgentAlertById = (id: string) => store().getUrgentAlertById(id);
export const saveUrgentAlert = (
  input: Parameters<typeof urgentAlertJson.saveUrgentAlert>[0],
) => store().saveUrgentAlert(input);
export const clearActiveUrgentAlert = () => store().clearActiveUrgentAlert();

export async function getPublicUrgentAlertById(id: string) {
  const alert = await getUrgentAlertById(id);
  if (!alert || !isUrgentAlertPubliclyViewable(alert)) {
    return null;
  }
  return alert;
}
