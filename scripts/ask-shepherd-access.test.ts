import assert from "node:assert/strict";
import {
  computeAskShepherdAccessSync,
  type AskShepherdAccessSyncInput,
} from "../src/lib/ask-shepherd-access-server";
import { ASK_SHEPHERD_DEPARTMENT_MAP } from "../src/lib/ask-shepherd-departments";

const dept = ASK_SHEPHERD_DEPARTMENT_MAP.worship;

function base(
  partial: Partial<AskShepherdAccessSyncInput> & Pick<AskShepherdAccessSyncInput, "userId">,
): AskShepherdAccessSyncInput {
  return {
    department: dept,
    seniorPastorUserId: null,
    associatePastorUserId: null,
    worshipGroup: null,
    explicitGrantActive: false,
    ...partial,
  };
}

const worshipGroup = {
  memberIds: ["m1", "lead1", "asst1"],
  adminIds: ["lead1"],
  assistantAdminIds: ["asst1"],
};

assert.equal(
  computeAskShepherdAccessSync(base({ userId: "sp", seniorPastorUserId: "sp" }))?.accessReason,
  "pastoral_oversight",
);
assert.equal(
  computeAskShepherdAccessSync(base({ userId: "ap", associatePastorUserId: "ap" }))?.accessReason,
  "pastoral_oversight",
);
assert.equal(
  computeAskShepherdAccessSync(base({ userId: "lead1", worshipGroup }))?.accessReason,
  "worship_leader_or_assistant",
);
assert.equal(
  computeAskShepherdAccessSync(base({ userId: "asst1", worshipGroup }))?.accessReason,
  "worship_leader_or_assistant",
);
assert.equal(computeAskShepherdAccessSync(base({ userId: "m1", worshipGroup })), null, "plain member denied");
assert.equal(
  computeAskShepherdAccessSync(
    base({ userId: "mediaLead", worshipGroup: { memberIds: ["m1"], adminIds: ["lead1"], assistantAdminIds: [] } }),
  ),
  null,
  "leader not in worship roster denied",
);
assert.equal(computeAskShepherdAccessSync(base({ userId: "other", worshipGroup })), null);
assert.equal(
  computeAskShepherdAccessSync(
    base({ userId: "granted", worshipGroup: { memberIds: ["granted"], adminIds: [], assistantAdminIds: [] }, explicitGrantActive: true }),
  )?.accessReason,
  "explicit_grant",
);

console.log("ask-shepherd-access.test.ts OK");
