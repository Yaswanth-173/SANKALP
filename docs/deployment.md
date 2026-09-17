# Production Deployment

## Architecture

- Frontend: Vercel, built from `client/`.
- Backend: Render web service defined in `render.yaml`.
- Database: any reachable PostgreSQL provider. The active backend uses `pg` and `DATABASE_URL`.
- Email: Gmail SMTP using an app password, or replace `server/src/utils/mailer.js` with another transactional provider.

## Render

1. Push this repository to the connected Git provider.
2. In Render, choose **New > Blueprint** and select the repository. Render will read `render.yaml` and create `sankalp-api`.
3. Add these secret values in the Render service environment settings: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`.
4. Deploy and check `https://<render-service>.onrender.com/api/health`. It must return `{"status":"ok"}`.
5. The first successful boot runs the live schema creation and material/contractor seeders. Use a database backup before deploying against an existing database.

## Vercel

In the Vercel project settings, add this production environment variable:

```text
VITE_API_URL=https://<render-service>.onrender.com
```

Redeploy after changing it. The frontend calls the backend with credentials, so Render's `CLIENT_URL` must exactly match the browser origin.

## Email prerequisite

Without `GMAIL_USER` and `GMAIL_APP_PASSWORD`, verification and password-reset messages are not delivered. In production the server does not print OTPs, so users cannot complete those flows without valid mail credentials.

## Local verification

```powershell
npm install
npm install --prefix client
npm install --prefix server
npm test --prefix server
npm run lint --prefix client
npm run build
```