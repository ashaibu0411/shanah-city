const fs = require("fs");
const content = `import assert from "node:assert/strict";
import {
  marriageHubLoadErrorMessage,
  resolveMarriageHubPageGate,
} from "../src/lib/marriage-hub-client";

assert.equal(
  resolveMarriageHubPageGate({
    authLoading: true,
    hubLoading: false,
    userId: "user-1",
    hubLoadError: null,
  }),
  "loading",
);

assert.equal(
  resolveMarriageHubPageGate({
    authLoading: false,
    hubLoading: false,
    userId: null,
    hubLoadError: null,
  }),
  "guest",
);

assert.equal(
  resolveMarriageHubPageGate({
    authLoading: false,
    hubLoading: false,
    userId: "user-1",
    hubLoadError: "__sign_in_required__",
  }),
  "sign_in_required",
);

assert.equal(
  resolveMarriageHubPageGate({
    authLoading: false,
    hubLoading: false,
    userId: "user-1",
    hubLoadError: "Server error",
  }),
  "error",
);

assert.equal(
  marriageHubLoadErrorMessage({ ok: false, kind: "auth", message: "Sign in required." }),
  "__sign_in_required__",
);

console.log("marriage-hub-client.test.ts: ok");
`;
fs.writeFileSync("scripts/marriage-hub-client.test.ts", content, "utf8");
