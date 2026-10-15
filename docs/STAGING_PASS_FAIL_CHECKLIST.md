# Stage 2 staging — pass / fail checklist

**Environment:** Staging URL only (not `shanah-city.vercel.app` production).  
**Tester:** _______________  **Date:** _______________  
**Staging URL:** _______________________________________________

Mark **PASS** or **FAIL**. Any **FAIL** blocks Phase 2C.

| # | Test | PASS | FAIL |
|---|------|:----:|:----:|
| 1 | Production live site: `/marriage/learn` does **not** show Stage 2 learning center (or redirects away) | ☐ | ☐ |
| 2 | Staging: `/marriage/learn` loads Couples Learning Center | ☐ | ☐ |
| 3 | Staging: intimacy module **not** listed in learning center | ☐ | ☐ |
| 4 | Partner A: create invite on `/marriage` | ☐ | ☐ |
| 5 | Partner B: accept on `/marriage/join` | ☐ | ☐ |
| 6 | Both see same journey on `/marriage` | ☐ | ☐ |
| 7 | Temperament module: save lesson progress `/marriage/module/s2-temperament-discovery` | ☐ | ☐ |
| 8 | Logout (`/profile`) and resume — answers persist | ☐ | ☐ |
| 9 | Family module: progress `/marriage/module/s2-mod-02-family-background` | ☐ | ☐ |
| 10 | Each partner submits Module 1 independently | ☐ | ☐ |
| 11 | Compare `/marriage/module/s2-temperament-discovery/compare` — shared items only; consent honored | ☐ | ☐ |
| 12 | Temperament summary visible on compare (non-diagnostic) | ☐ | ☐ |
| 13 | Budget module accepts valid totals `/marriage/module/s2-financial-workshop` | ☐ | ☐ |
| 14 | Budget rejects expenses over income | ☐ | ☐ |
| 15 | Counselor view shows lesson **counts only** `/marriage/counselor/journey/...` | ☐ | ☐ |
| 16 | Mobile: learning center + one lesson save usable (~390px width) | ☐ | ☐ |
| 17 | Curriculum admin published Stage 2 version on staging `/marriage/admin/curriculum` | ☐ | ☐ |

**Result:** ☐ All PASS — approved to start Phase 2C planning/implementation  
**Result:** ☐ One or more FAIL — fix on staging before Phase 2C

**Signed:** _______________________
