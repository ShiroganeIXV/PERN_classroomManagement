# PERN_classroomManagement

## Backend URL and Arcjet configuration

Set `BETTER_AUTH_URL` to the backend's public origin (for example, `https://classroom-api.up.railway.app`) and `FRONTEND_URL` to the frontend origin. `BETTER_AUTH_URL` is the URL Better Auth uses for callbacks; do not set it to the frontend URL. On Railway, `RAILWAY_PUBLIC_DOMAIN` is used as a fallback and is served over HTTPS. Production startup fails if neither URL is available, rather than silently using localhost.

For Railway, configure `BETTER_AUTH_URL`, `FRONTEND_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `ARCJET_KEY` in the backend service's variables. Set `NODE_ENV=production` and `ARCJET_ENV=production`; the backend also normalizes existing `development` or `test` values for `NODE_ENV`, `ARCJET_ENV`, and `MODE` to `production` as soon as its environment bootstrap runs. Arcjet's `127.0.0.1` fallback warning is expected during local development, where there may be no public client IP. Do not trust or accept a client-supplied IP header to hide that warning.

For local development, use a backend URL that matches the local port, such as `BETTER_AUTH_URL=http://localhost:8000`, and set the frontend origin in `FRONTEND_URL`. Arcjet may use `127.0.0.1` locally when no public IP is available.