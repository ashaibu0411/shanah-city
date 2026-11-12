# Populated Community visual acceptance test (non-production)

The guest/empty screenshots in this folder do **not** validate populated Stories, image posts, reactions, or the authenticated composer. To close the gap, use a **dedicated synthetic QA member** and **non-sensitive fixture content** in a disposable local or staging DB. Never use a production database or real member records for screenshot fixtures.

## Prepare the test data

In your local development or isolated staging environment, use existing normal UI/API actions with a dedicated test account to create:
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

The test **fails deliberately** if the feed has fewer than two post cards, lacks a visible image, or has fewer than two story rings. It captures the signed-in Community viewport, full page and opened composer at 390×844 and 430×932. These results are additional evidence alongside the existing guest/empty screenshots, not a replacement.

Save only **synthetic-data** screenshots in this PR. Screenshots must be manually reviewed for unintended private content before committing. Never commit login credentials.
