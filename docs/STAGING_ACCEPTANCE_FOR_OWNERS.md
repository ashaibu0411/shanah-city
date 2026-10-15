# Marriage Stage 2 — Staging acceptance (for project owners)

Use this checklist on your **staging URL only** — not on the live church site (`https://shanah-city.vercel.app`).  
**Setup first:** [`VERCEL_MARRIAGE_STAGING.md`](./VERCEL_MARRIAGE_STAGING.md)  
**Pass/fail sign-off:** [`STAGING_PASS_FAIL_CHECKLIST.md`](./STAGING_PASS_FAIL_CHECKLIST.md)

Use **two test accounts** you authorize (e.g. staff test logins). Do not copy production member data into staging.

---

## Before you test (one-time setup)

### A. Database

1. Confirm your host (Vercel → Project → Settings → Environment Variables) has **`DATABASE_URL`** set for Production (and Preview if you use it).
2. Migrations must include the three marriage migrations (Oct 2026): counseling hub, Stage 2, Phase 2A.
3. After any deploy, the build runs **`prisma migrate deploy`** when `DATABASE_URL` is present. You can also run locally (with your developer’s help): `npm.cmd run db:deploy`.

### B. Stage 2 feature flags (staging / acceptance only)

In Vercel → Settings → Environment Variables, set for the environment you are testing:

| Variable | Value |
|----------|--------|
| `MARRIAGE_HUB_STAGE2_ENABLED` | `1` |
| `NEXT_PUBLIC_MARRIAGE_STAGE2` | `1` |
| `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` | **Leave unset** (do not set to `1` until pastoral approval) |

Redeploy after changing variables.

**Quick check:** Open `/marriage/learn`. If Stage 2 is on, the **Couples Learning Center** loads. If you are sent back to `/marriage`, flags are off or the deploy did not pick them up.

### C. Curriculum publish (once per acceptance run)

1. Sign in as a **curriculum admin** (your team must set `MARRIAGE_CURRICULUM_ADMIN_USER_IDS` on the host).
2. Go to **`/marriage/admin/curriculum`**.
3. Create or open a draft that includes Stage 2 modules, then **Publish**.
4. Publishing **freezes** full Module 1–6 question banks into that version. Existing couple answers stay tied to the **content version** they started with.

---

## Manual acceptance checklist

Check each box when it works on your test URL.

### 1. Partner A creates an invitation

1. Partner A signs in → open **`/marriage`**.
2. Start **Premarital** (or your program) using the flow that **creates a partner invite** (invite code appears on the hub).
3. Complete **consent** if prompted (`/marriage/consent`).

### 2. Partner B accepts

1. Partner B signs in on a **different browser or device** (or private window).
2. Open **`/marriage/join`**.
3. Enter Partner A’s **invite code** → accept.
4. Both partners open **`/marriage`** and confirm they see the **same journey**.

### 3. Couples Learning Center

1. Both open **`/marriage/learn`**.
2. Confirm modules appear (temperament, family background, financial workshop, etc.).
3. Confirm **intimacy** module **does not** appear in the list.

### 4. Temperament lessons (Module 1)

1. Both open **`/marriage/module/s2-temperament-discovery`**.
2. Use the **lesson list**; open a lesson, answer at least one question, tap **Continue** / save.
3. Leave and return — lesson progress should show on the card.

### 5. Save and resume after logout

1. Partner A: answer more in a lesson, then sign out via **`/profile`** → **Sign out**.
2. Sign in again → reopen **`/marriage/module/s2-temperament-discovery`** — answers should still be there.

### 6. Family background (Module 2)

1. Both work through **`/marriage/module/s2-mod-02-family-background`** (at least one lesson each).

### 7. Independent submissions

1. Partner A: open **`/marriage/module/s2-temperament-discovery/submit`** (or **Review and submit** from the module) and submit when ready.
2. Partner B: submit the **same module** independently (does not require submitting at the same time).

### 8. Consent-aware comparison

1. After **both** have submitted Module 1, open **`/marriage/module/s2-temperament-discovery/compare`**.
2. Shared items appear; **private** reflections do not.
3. For items that ask **consent to share**, leave consent off and confirm those answers stay out of compare until both agree.

### 9. Temperament summary

1. On the compare page, confirm a **Temperament snapshot** (or summary) section with non-diagnostic wording.

### 10. Financial budget

1. Open **`/marriage/module/s2-financial-workshop`**.
2. Complete the **budget worksheet** with expenses **not** exceeding income → submit succeeds.
3. (Optional) Try expenses greater than income — submit should be **blocked** with a clear message.

### 11. Counselor lesson progress

1. Sign in as a **counselor** assigned to the journey (or configured via `MARRIAGE_COUNSELOR_USER_IDS`).
2. Open **`/marriage/counselor`** → select the couple’s journey → **`/marriage/counselor/journey/[journeyId]`**.
3. Confirm **Stage 2 lesson progress** shows **counts only** (no private answer text).

### 12. Mobile usability

1. On a phone browser, repeat: **`/marriage/learn`**, open a module, save one answer, use bottom navigation without losing work.
2. (Optional) Android app: ensure the app points at your test URL (`CAPACITOR_SERVER_URL` / config) and repeat the same steps.

---

## Sign-off

When all boxes pass on your chosen test environment, note the date and published curriculum **version label**. Phase 2C development can start only after this sign-off.

Technical reference: [`STAGE_2_STAGING_ACCEPTANCE.md`](./STAGE_2_STAGING_ACCEPTANCE.md).
