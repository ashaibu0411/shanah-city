# Shanah City Church App

A modern, interactive church platform for **Shanah City** — built for daily use across all campuses.

## What's included

| Feature | Description |
|---|---|
| **Daily Hub** | Home screen with quick actions members open every day |
| **Live Stream** | Embedded worship with live badge and viewer count |
| **Devotions** | Daily scripture, reflection, prayer — mark as read |
| **Meetings** | Zoom & Teams links with one-tap join + copy link |
| **Community** | Prayer wall with reactions and post submissions |
| **Shop** | Church store with cart (Stripe-ready checkout) |
| **Photos** | Member gallery — browse, download, and team upload |
| **Give** | Online giving funds (ready for Stripe/Pushpay) |

## App experience

- Mobile bottom navigation + desktop sidebar
- Campus selector in the top bar
- PWA manifest for add-to-homescreen
- Interactive UI: pray buttons, devotion streaks, shop cart

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Photo gallery

- **Browse:** `/photos` — filter by album, tap to view full size, download
- **Upload:** `/photos/upload` — church team uploads with a PIN
- Default PIN: `shanahcity` (set `GALLERY_UPLOAD_PIN` in `.env.local` to change)

Uploaded photos save to `public/gallery/uploads/` and appear immediately.

## Customize content

Edit `src/lib/site.ts` for:

- Campuses and service times
- Live stream embed URL
- Devotions, meetings, shop products
- Community posts and events

## Next integrations (when you're ready)

1. **Auth** — member sign-in (Clerk, Auth0, or Firebase)
2. **Live stream** — YouTube Live / Vimeo / Resi API
3. **Payments** — Stripe for shop + giving
4. **Push notifications** — daily devotion reminders
5. **Native app** — wrap with Expo or Capacitor
6. **CMS** — Sanity or Contentful for devotions & events
7. **Database** — Supabase for prayers, profiles, orders

## Project structure

```
src/
  app/              # Pages (live, devotions, meetings, shop, etc.)
  components/app/   # App shell, nav, campus selector
  components/       # Feature UI (community, shop, devotions)
  lib/site.ts       # All church content & config
```
