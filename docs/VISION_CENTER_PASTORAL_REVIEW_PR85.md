# Senior Pastor — 2027 Vision Center (PR #85) staging review

**Preview (feature branch, staging Vercel project):**  
https://shanah-city-staging-git-feature-8f4b6e-zaqnombre-9816s-projects.vercel.app

**Built from commit:** `3d8470b883c449ff76f05e9f76b12bd476055d43` (includes `cbd22f5c` Vision Center Phase 1)  
**Deployment status:** Vercel **Ready** on `shanah-city-staging` (see [PR #85](https://github.com/ashaibu0411/shanah-city/pull/85) checks).

**Not in scope:** merging PR #85, production deploy, or production database changes.

---

## 1. Open the preview (authorized reviewers)

The preview URL is protected by **Vercel authentication**.

1. Sign in with a GitHub account that has access to the **shanah-city-staging** Vercel project (same team as repo deploys), **or** use a deployment protection bypass link from the project owner.
2. Then open: **https://shanah-city-staging-git-feature-8f4b6e-zaqnombre-9816s-projects.vercel.app/leadership/vision**

If you see “Protected by Vercel Authentication”, complete Vercel SSO first; the app sign-in screen should appear only after protection is satisfied.

---

## 2. Sign in to Shanah City (staging database)

Use your **normal staging** Shanah City account (not production).

**Senior Pastor workspace** appears when you sign in as the user assigned to the staging **Senior Pastor** pastoral slot.

For this review, staging **Senior Pastor** is **`ribonbishop@yahoo.com`** (`user-1792126579919`). Sign in with that staging account (not production). Production pastoral slots were **not** modified.

**Quick path:** After sign-in → **Admin portal** → **2027 Vision Center**, or go directly to `/leadership/vision`.

---

## 3. What you should see

- **Nine** private **2027** ministry working drafts (all **draft**, none approved).
- **No** approved worship plan and **no** leftover QA assignments or comments from automated tests.
- **Nothing** here creates public calendar events.

**Senior Pastor**

1. **Admin portal** → **2027 Vision Center**, or `/leadership/vision`.
2. Sidebar: **9** ministry visions (churchwide, worship, young adults, men, women, SHIFT, Hail the King, Shanah Cares, operations).
3. Open a ministry → review text → **Assign** a ministry leader → optional **Approval & review history** after actions.

**Ministry leader (optional walkthrough)**

1. Sign in as an assigned leader.
2. **Groups** hub → **My 2027 Vision Assignments**, or open the plan link from a notification.
3. **Acknowledge** → draft **proposal** → **Submit**; post **questions/ideas** with optional **HTTPS** design links only.

**Mobile**

- Use phone browser or narrow window (~412px). Layout uses stacked cards and `max-w-5xl` content width.

---

## 4. Notifications

Vision assignment and review events call the standard **announcements** push path (`2027 Vision Center` title, generic body, deep link `/leadership/vision?plan=…`).

- Recipients need **announcements** (or push) enabled in notification preferences.
- **Web push** requires an active browser subscription on staging; many staging accounts have none, so a push may not appear even when the server sends successfully.
- In-app testing confirmed the API workflow; device delivery depends on subscriptions on the reviewer account.

---

## 5. Staging data notes (completed before review)

| Item | Status |
|------|--------|
| Senior Pastor slot (staging) | `ribonbishop@yahoo.com` (`user-1792126579919`) |
| Nine 2027 drafts | Retained |
| Test worship approval / QA comments & audits | Removed; worship plan reset to **draft** |
| Production pastoral roles / DB | **Unchanged** |

---

## 6. Support

Technical acceptance artifacts: `docs/VISION_CENTER_STAGING_ACCEPTANCE_PR85.md` and `.json`.

Questions or access issues (Vercel SSO, staging sign-in, pastoral role on staging): contact the Shanah City technical admin.