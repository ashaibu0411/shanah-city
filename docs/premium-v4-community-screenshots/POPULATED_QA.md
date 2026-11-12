# Populated Community visual acceptance test (non-production)

The guest/empty screenshots in this folder do **not** validate populated Stories, image posts, reactions, or the authenticated composer. To close the gap, use a **dedicated synthetic QA member** and **non-sensitive fixture content** in a disposable local or staging DB. Never use a production database or real member records for screenshot fixtures.

## Prepare the test data

For repeatable local QA (isolated `@shanah-city-qa.invalid` accounts only), **confirm the application's `DATABASE_URL` is an isolated, disposable QA database rather than the connected shared staging or production database**, then start the app and explicitly opt in:

```sh
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES \\
PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000' \\
node scripts/premium-v4-community-populated-fixture.mjs
```

The script refuses public URLs and generates random test-account passwords. **Do not blindly set the opt-in flag without checking which database the local server is connected to.** Previously seeded synthetic staging accounts should be identified and cleaned up by an authorized administrator after verifying they are QA-only.

Then export the printed `PLAYWRIGHT_COMMUNITY_EMAIL` / `PLAYWRIGHT_COMMUNITY_PASSWORD` and run the Playwright config below.

Alternatively, use existing normal UI/API actions with a dedicated test account to create:
- Two or more public church-wide Community posts: one with a licensed/owned sample image and one text testimony.
- At least one active public Story from a *different* synthetic test account (so the story row contains more than the personal Add Story ring).
- Optionally a second image and one non-sensitive reaction/comment.
- Do not include personal health information, real people's names, or private group-only stories.

**Do not bypass API authorization**, create hidden database seeding endpoints, or publish test posts to the church's production feed.

## Capture

With the app running in production mode (`npm run build && npm run start`) against the disposable fixture database, run:

```sh
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 \
PLAYWRIGHT_COMMUNITY_EMAIL='qa-member@example.invalid' \
PLAYWRIGHT_COMMUNITY_PASSWORD='<test account password from environment>' \
PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000' \
npx playwright test -c playwright.premium-v4-community-populated.config.ts
```

The test **fails deliberately** if the feed has fewer than two post cards, lacks a visible image, or has fewer than two story rings. It captures populated feed, stories row, composer (including focused field), story viewer slides, comments/replies, filter selection, horizontal composer/filter rails, and scrolled chrome at 390×844 and 430×932.

## Cleanup synthetic QA users

After verifying screenshots, remove only `@shanah-city-qa.invalid` accounts from the **same disposable database**:

```sh
PREMIUM_V4_QA_CLEANUP_CONFIRMED=YES npx tsx scripts/premium-v4-community-qa-cleanup.ts
```

Save only **synthetic-data** screenshots in this PR. Screenshots must be manually reviewed for unintended private content before committing. Never commit login credentials.
