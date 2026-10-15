import { prepareE2eIsolatedData } from "../e2e/helpers/e2e-isolated-data";

/** Playwright globalSetup: must default-export a single function. */
export default async function globalSetup() {
  await prepareE2eIsolatedData();
  console.log("e2e-marriage-global-setup: isolated data ready at .e2e-isolated/");
}
