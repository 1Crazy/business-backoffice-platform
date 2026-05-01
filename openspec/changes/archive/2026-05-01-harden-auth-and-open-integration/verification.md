## Automated Verification

- `pnpm --filter platform-api lint` passed.
- `pnpm --filter platform-api test` passed: 34 suites, 114 tests.
- `pnpm --filter main-web lint` passed.
- `pnpm --filter oa-web lint` passed.
- `pnpm --filter scrm-web lint` passed.

## Covered Scenarios

- Weak/default `JWT_SECRET` is rejected by security config tests.
- Login and refresh token failures are rate limited by `RiskThrottleService` tests.
- Auth controller sets, reads and clears the refresh token HttpOnly cookie.
- Connector login rejects requests without proof and accepts client-secret proof.
- Open API credential checks use failure throttling.
- Upload rejects declared MIME/content mismatches and normalizes unsafe filenames.
- Full backend suite still passes after security changes.

## Manual Verification Notes

- Full browser-based login/refresh verification was not run in this session because no local API/database/frontend stack was started.
- The implemented refresh-token migration is intentionally compatible: the API sets/reads `platform_refresh_token` as an HttpOnly cookie, while the request body refresh token remains supported during the transition.
- Frontend HTTP clients now send credentials, so host and child apps can participate in cookie-based refresh once served behind compatible CORS or same-origin deployment.
