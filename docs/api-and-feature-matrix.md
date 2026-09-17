# Sankalp backend contract

The deployed frontend currently calls the existing Express API. Authentication uses an `httpOnly` cookie named `token`; clients must not send or store JWTs in browser storage.

| Frontend feature | API | Current storage/authorization | Validation/security |
| --- | --- | --- | --- |
| Signup | `POST /api/auth/register` | `users` / Supabase `auth.users` + `profiles`; unauthenticated | Email, Indian phone, strong password, duplicate email, hashed OTP |
| Email verification | `POST /api/auth/verify-email`, `POST /api/auth/resend-verification` | Verification fields on user; session only after verification | 10 minute expiry, 5 attempts, 30 second resend cooldown, hashed OTP |
| Login/session | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | `httpOnly` cookie; owner resolved from session | Rate limited, verified email required, no token in JSON |
| Password reset | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Hashed reset OTP on user | Generic response, expiry, server-side password validation |
| Profile/preferences | `PATCH /api/auth/profile`, `PATCH /api/auth/preferences` | Authenticated owner only | No user id accepted from client |
| Materials/shops | `GET /api/materials/shops` | Catalog read; authenticated | Coordinates are validated by the query layer, distance is Haversine, current implementation is legacy PostgreSQL |
| Orders | `GET /api/materials/orders`, `POST /api/materials/orders` | Orders filtered by authenticated user | Prices read from DB, rows locked, stock checked/decremented in transaction |
| Contractors | `GET /api/contractors` | Authenticated catalog read | Separate contractor data, not material products |
| Messages | `/api/messages/*` | Contact ownership checked on every request | No cross-user contact/message access |
| Notes | `/api/notes/*` | `user_id = authenticated user` | Ownership in every write/delete query |
| Calendar | `/api/calendar/events*` | `user_id = authenticated user` | Date/type validation and ownership filters |
| Tasks | `/api/tasks/*` | `user_id = authenticated user` | Status/type/priority validation and ownership filters |

## Supabase deployment

Apply `supabase/migrations/0001_sankalp_core.sql` to the target Supabase project. It creates the normalized catalog, cart, order, project, contractor, report, note, messaging, notification, calendar, address, payment, and audit tables, plus RLS policies for user-sensitive data.

The current Express server still uses `DATABASE_URL` and its legacy schema. Switching runtime reads/writes to Supabase Auth/PostgREST is a separate migration step requiring a Supabase project URL, anon key, service-role key, and a data migration plan. Do not put the service-role key in Vercel client variables.

## Location

`MaterialsPage` requests browser geolocation once, reverse-geocodes coordinates, and falls back to the profile/manual city. The current reverse geocoder is public Nominatim and therefore needs a production provider with an agreed usage policy before high-volume deployment. The Supabase schema stores a PostGIS point for efficient nearby queries.

## Known production prerequisites

- Configure `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and transactional email credentials in the backend deployment.
- Apply the Supabase migration and decide whether Express or Supabase Edge Functions own runtime data access.
- Configure a production reverse-geocoding provider and server-side proxy/rate limit.
- Add a payment provider before exposing paid checkout; the current order flow intentionally leaves `payment_status` pending.
