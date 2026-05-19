#!/usr/bin/env node
// Submits the route list to IndexNow (Bing/Yandex/Seznam/Naver share one
// endpoint). Runs last in the build pipeline AFTER deploy, so we only
// hit it from CI on main-branch deploys — locally it no-ops unless
// INDEXNOW_FORCE=1 is set.

import { SITE_ORIGIN, STATIC_ROUTES, INDEXNOW_KEY } from './seo/routes.mjs';

const ENDPOINT = 'https://api.indexnow.org/IndexNow';

if (!process.env.CI && process.env.INDEXNOW_FORCE !== '1') {
  console.log('[indexnow] skipped (not CI; set INDEXNOW_FORCE=1 to override)');
  process.exit(0);
}

const body = {
  host: SITE_ORIGIN.replace(/^https?:\/\//, ''),
  key: INDEXNOW_KEY,
  keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
  urlList: STATIC_ROUTES.map((r) => `${SITE_ORIGIN}${r.path}`),
};

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[indexnow] ${res.status} ${res.statusText} :: ${text}`);
    process.exit(res.status === 422 ? 0 : 1);
  }
  console.log(`[indexnow] submitted ${body.urlList.length} URL(s) — ${res.status}`);
} catch (err) {
  console.error('[indexnow] network error:', err.message);
  // Non-fatal: indexing is best-effort, do not break the deploy.
  process.exit(0);
}
