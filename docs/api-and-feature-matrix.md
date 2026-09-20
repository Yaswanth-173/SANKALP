# Sankalp backend contract

The deployed frontend currently calls the existing Express API. The live backend uses the `pg` driver and the PostgreSQL database configured by `DATABASE_URL`. Authentication uses an `httpOnly` cookie named `token`; clients must not send or store JWTs in browser storage.

| Frontend feature | API | Current storage/authorization | Validation/security |
| --- | --- | --- | --- |
| Signup | `POST /api/auth/register` | `users` / Supabase `auth.users` + `profiles`; unauthenticated | Email, Indian phone, strong password, duplicate email, hashed OTP |
| Email verification | `POST /api/auth/verify-email`, `POST /api/auth/resend-verification` | Verification fields on user; session only after verification | 10 minute expiry, 5 attempts, 30 second resend cooldown, hashed OTP |
| Login/session | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | `httpOnly` cookie; owner resolved from session | Rate limited, verified email required, no token in JSON |
| Password reset | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Hashed reset OTP on user | Generic response, expiry, server-side password validation |
| Profile/preferences | `PATCH /api/auth/profile`, `PATCH /api/auth/preferences` | Authenticated owner only | No user id accepted from client |
| Materials/suppliers | `GET /api/materials/search`, `GET /api/materials/:id/suppliers`, `GET /api/suppliers/nearby`, `GET /api/suppliers/:id` | Catalog read; authenticated | Supplier/material/inventory/price model (see `server/src/db/ensureSchema.js`); distance is server-side Haversine with a lat/lng bounding-box pre-filter for index use |
| Supplier registration/verification | `POST /api/suppliers/register`, `GET/PATCH /api/suppliers/mine(/materials)`, `POST /api/supplier-materials`, admin-only `GET /api/suppliers/admin/pending`, `PATCH /api/suppliers/:id/verify(/disable)` | Ownership checked per supplier/user; admin-only verification | New suppliers are `verification_status: 'pending'` until an admin approves them — never shown "Verified" otherwise |
| Orders | `GET /api/materials/orders`, `POST /api/materials/orders` | Orders filtered by authenticated user | Prices/inventory read from `material_prices`/`inventory`, rows locked, stock checked/decremented in transaction |
| Contractors | `GET /api/contractors` | Authenticated catalog read | Separate contractor data, not material products |
| Messages | `/api/messages/*` | Contact ownership checked on every request | No cross-user contact/message access |
| Notes | `/api/notes/*` | `user_id = authenticated user` | Ownership in every write/delete query |
| Calendar | `/api/calendar/events*` | `user_id = authenticated user` | Date/type validation and ownership filters |
| Tasks | `/api/tasks/*` | `user_id = authenticated user` | Status/type/priority validation and ownership filters |

## Database and backend deployment

For the current application, provision any reachable PostgreSQL database and set `DATABASE_URL` in the backend deployment. On startup, `server/src/db/ensureSchema.js` creates the live tables and the seeders populate contractor and material data. The current API does not use Supabase Auth, Supabase PostgREST, Supabase Storage, or Supabase Row Level Security.

The repository intentionally has no `supabase/` integration. Supabase can still be used as the PostgreSQL host by supplying its connection string as `DATABASE_URL`, but it is then PostgreSQL only: the server continues to use `pg` and its existing schema. Do not add Supabase Auth, PostgREST, or RLS claims unless the runtime is deliberately migrated and tested.

## Location

`MaterialsPage` requests browser geolocation once, reverse-geocodes coordinates, and falls back to the profile/manual city. The current reverse geocoder is public Nominatim and therefore needs a production provider with an agreed usage policy before high-volume deployment. The live raw PostgreSQL schema currently calculates Haversine distance in the materials controller.

## Known production prerequisites

- Configure `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and transactional email credentials in the backend deployment.
- Deploy the Express server separately from the Vercel frontend using the root `render.yaml` blueprint, then point `VITE_API_URL` at the Render service URL.
- Set `CLIENT_URL` to the exact Vercel origin, including `https://` and excluding any trailing path.
- Configure a production reverse-geocoding provider and server-side proxy/rate limit.
- Add a payment provider before exposing paid checkout; the current order flow intentionally leaves `payment_status` pending.
