# Peek

Peek is a Next.js 14 marketplace where users can post nearby physical-check requests.

## Tech stack

- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Auth + Postgres + Edge Functions)
- Google Maps (Places Autocomplete + map pins)
- Web Push (proximity notifications for Peeks)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add environment values in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   ```

   Enable **Maps JavaScript API** and **Places API** on your Google Cloud key.

   Generate VAPID keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

3. Run SQL in the Supabase SQL editor (in order if upgrading):

   - `supabase/schema.sql` (new projects)
   - `supabase/migrations/001_runner_and_responses.sql`
   - `supabase/migrations/002_location_coordinates.sql`
   - `supabase/migrations/003_runner_notifications.sql`

4. Deploy the proximity notification Edge Function:

   ```bash
   npx supabase functions deploy notify-nearby-runners
   ```

   Set function secrets in Supabase (Dashboard → Edge Functions → Secrets):

   - `VAPID_PUBLIC_KEY` (same as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
   - `VAPID_PRIVATE_KEY`

5. Enable magic link auth and add redirect URL `http://localhost:3000/auth/callback`.

6. Start development:

   ```bash
   npm run dev
   ```

## Map & location

- **Post a request**: Google Places autocomplete saves address + lat/lng.
- **Browse**: All open requests on the map and list. "Use my location" only centers the map (optional).
- **Notifications**: Radius (0.1–50 km, default 5 km) on your profile only affects push alerts, not browsing.

## Proximity notifications

- Profile: radius slider (0.1–50 km) and notification on/off toggle for Peeks.
- New requests trigger `notify-nearby-runners` to push nearby Peeks.
- Example: `New request 0.4km away - Is the Nike store open? £3`

Peeks must enable notifications on their profile (browser permission + push subscription).
