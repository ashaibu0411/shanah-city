const STAGING_PREFIX = "ep-soft-flower-b89de4t0";
const PROD_PREFIX = "ep-young-glade-auv3jgsb";

function classify(raw, label) {
  if (!raw?.trim()) {
    console.log(`${label}=MISSING`);
    return;
  }
  try {
    const h = new URL(
      raw.trim().replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"),
    ).hostname;
    if (h.includes(STAGING_PREFIX)) console.log(`${label}=STAGING_OK`);
    else if (h.includes(PROD_PREFIX)) console.log(`${label}=PRODUCTION_FORBIDDEN`);
    else console.log(`${label}=UNKNOWN_HOST`);
  } catch {
    console.log(`${label}=UNPARSEABLE`);
  }
}

classify(process.env.DATABASE_URL, "DATABASE_URL");
classify(process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL, "DIRECT_URL");
