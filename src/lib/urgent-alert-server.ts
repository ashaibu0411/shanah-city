import { useDatabase } from "@/lib/use-database";
import * as urgentAlertDb from "@/lib/stores/urgent-alert-db";
import * as urgentAlertJson from "@/lib/stores/urgent-alert-json";

const store = () => (useDatabase() ? urgentAlertDb : urgentAlertJson);

export const listUrgentAlerts = () => store().listUrgentAlerts();
export const getActiveUrgentAlert = () => store().getActiveUrgentAlert();
export const getUrgentAlertById = (id: string) => store().getUrgentAlertById(id);
export const saveUrgentAlert = (
  input: Parameters<typeof urgentAlertJson.saveUrgentAlert>[0],
) => store().saveUrgentAlert(input);
export const clearActiveUrgentAlert = () => store().clearActiveUrgentAlert();
