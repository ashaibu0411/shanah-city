import assert from "node:assert/strict";
import { getDatesInMonth } from "../src/lib/calendar-utils";

const monthly = { id:"a", title:"Men's breakfast", startsOn:"2026-11-21", recurringMonthDay:21 };
assert.deepEqual(getDatesInMonth(monthly,2026,9),[]);
assert.deepEqual(getDatesInMonth(monthly,2026,10),["2026-11-21"]);
assert.deepEqual(getDatesInMonth(monthly,2026,11),["2026-12-21"]);
assert.deepEqual(getDatesInMonth({...monthly,endsOn:"2026-12-20"},2026,11),[]);
assert.deepEqual(getDatesInMonth({...monthly,startsOn:"2026-01-31",recurringMonthDay:31},2026,1),[]);
assert.deepEqual(getDatesInMonth({...monthly,startsOn:"2026-01-31",recurringMonthDay:31},2026,2),["2026-03-31"]);
const weekly = { id:"b", title:"Weekly prayer",startsOn:"2026-11-17",recurringWeekday:2 };
assert.deepEqual(getDatesInMonth(weekly,2026,10),["2026-11-17","2026-11-24"]);
assert.deepEqual(getDatesInMonth(weekly,2026,11),["2026-12-01","2026-12-08","2026-12-15","2026-12-22","2026-12-29"]);
const single = { id:"c", title:"One-off",startsOn:"2026-11-20" };
assert.deepEqual(getDatesInMonth(single,2026,10),["2026-11-20"]);
assert.deepEqual(getDatesInMonth(single,2026,11),[]);
console.log("Monthly, weekly and single-event calendar recurrence tests passed.");
