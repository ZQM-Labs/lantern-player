# Player Continuity and Release Validation

This document defines what must be checked before claiming that the standalone player is resilient to local-network, API, cache, and deployment failures. It is a validation guide, not evidence that those checks have already passed.

## Deployment boundary

The player is a static HTML/CSS/JavaScript PWA. Static player hosting and the live game API are separate services:

- The player shell and approved public assets may be edge-hosted.
- Live kit state, protected content packs, participant progress, organizer exports, and access-code validation require server-side authorization.
- Never place answer keys, paid kit assets, access codes, participant data, or organizer exports in the public shell or service-worker precache.
- Demo mode (`?demo=1`) should not require the live API. Live mode must fail clearly and safely if the API is unreachable.

The Cloudflare Pages project and custom-domain state must be checked in the Cloudflare dashboard before release. A successful preview deployment is not proof that production is enabled, that a custom domain is attached, or that API CORS is correct.

## Local validation

Run these from the repository root. They require a compatible Node.js installation; the browser end-to-end suite additionally requires the Playwright package and Chromium browser to be available.

```sh
node --check app.js
node --check global-story.js
node --check i18n.js
node --check sw.js
node scripts/test-player-source.cjs
node --test tests/global-story.test.cjs
node --test tests/release-e2e.test.cjs
```

If a command cannot run because a dependency/browser is unavailable, record it as **not run** rather than passing. Do not trigger hosted Actions solely to repeat a successful static check when hosted minutes are constrained.

## Release gates

### Static asset and source checks

- Every local HTML asset reference resolves to a tracked file.
- The service-worker precache contains only approved public assets.
- The four Brand Dial levels—Cozy Glow, Spooky, After Dark, Overdrive—have required variants for every authored stop and expected visual assets.
- Cache version changes whenever shell code or cached assets change. Verify the cache key in `sw.js`; do not assume a deployment changes it automatically.
- No internal hostname, secret, answer key, private kit, customer/participant data, or Project Volusia material is included.
- Headers are reviewed against actual runtime needs. Do not add a broad CSP until all script, style, image, map, audio and API dependencies are inventoried and tested.

### Browser and offline checks

- Fresh install: player starts in demo mode without uncaught JavaScript errors.
- Cached install: player starts after one successful load with the device offline.
- Offline mode: supported story/puzzle content remains usable; API-dependent features show a clear degraded state.
- Reconnection: queued progress, if implemented, replays idempotently and visibly reports pending/synced/failed states.
- Service-worker upgrade: old cache is replaced without a blank screen or incompatible asset mix.
- Low-storage and storage-eviction cases do not falsely claim that progress is backed up.
- Test a narrow mobile viewport, keyboard navigation, focus visibility, reduced motion, and representative screen-reader labels.

### Live API and authorization checks

Run only against a controlled test environment until all gates pass:

- Valid, expired, unknown, inactive and wrong-kit access codes.
- Direct unauthenticated access to the underlying content-pack URL must be denied; protecting only the API endpoint is insufficient.
- Organizer exports remain denied without organizer authentication/authorization.
- Malformed and oversized request bodies are rejected; write endpoints enforce rate limits and idempotency.
- CORS preflight and actual requests succeed only from the explicitly approved player origins.
- API outage does not crash the static shell or display a false success state.
- Do not use production participant records or private paid content as test fixtures.

### Hosting and recovery checks

- Confirm the intended Pages project, production branch, production-deployment setting, custom domains, latest successful production deployment, and source commit SHA.
- Verify the player hostname from an external network, not only the home LAN.
- Verify expected security headers, manifest/icon paths, cache behavior and service-worker scope on the actual hostname.
- Check the homepage and player independently. Static-site availability does not prove API availability.
- Record last-known-good deployment ID and rollback action before production release.
- Confirm that rollback of static files does not leave an incompatible API/schema version.
- Run a local-network disconnect test only after the API has been moved off the local failure domain or a safe test environment is available.

## Incident response

### Player loads, but live play fails

1. Check static player availability and API health independently.
2. Verify CORS and origin allowlist against the actual deployed player hostname.
3. Check authorization response and backend readiness without logging access codes or participant data.
4. If the API is down, show the approved degraded/offline behavior and activate the API recovery runbook. Do not make emergency DNS edits without validating the candidate origin.

### Broken player after release

1. Record the deployed source SHA and Pages deployment ID.
2. Stop promotion and roll back to the known-good static deployment if the rollback target is compatible.
3. Verify fresh install, cached install and API-origin behavior after rollback.
4. Preserve logs, add a regression test and only retry after the cause is understood.

### Cache appears stale

1. Compare deployed source SHA with the service-worker cache key.
2. Confirm all changed shell assets are versioned/precached as intended.
3. Test upgrade from an older installed cache and a clean browser profile.
4. Never instruct users to clear storage as a substitute for fixing cache-versioning defects.

## Evidence record

For each release, record:

- Player source SHA and corresponding site/backend versions.
- Local checks run, checks skipped and exact reasons.
- Browser/offline matrix and results.
- Actual player hostname, API origin classification, CORS result and security-header result.
- Pages deployment ID, timestamp, production/preview status and rollback target.
- Known limitations, unresolved failures, operator and approval.

**Definition of done:** no unresolved startup errors; no protected-content bypass; all four tiers are covered; cache/offline behavior is tested; the intended host and API origins are verified; release/rollback evidence is recorded. Static source assertions alone do not satisfy this definition.
