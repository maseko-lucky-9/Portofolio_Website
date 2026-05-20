// Source of truth for site routes consumed by build-sitemap.mjs,
// indexnow-submit.mjs, and (future) prerender plugin.
//
// Until the A1 prerender + route-split refactor lands, only `/` is
// physically served as a discrete URL. New routes added here MUST also
// be added to React Router and the prerender config; otherwise the
// sitemap will advertise URLs that 404 (or that all serve the SPA
// shell — equivalent from a crawler's perspective).

export const SITE_ORIGIN = 'https://thulanimaseko.com';

/** @type {Array<{path: string, priority: number, changefreq: string}>} */
export const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'monthly' },
  // Statically-generated content indexes — produced by build-static-pages.mjs.
  // Individual posts are picked up from dist/content-manifest.json by
  // build-sitemap.mjs at run time (not hardcoded here).
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/answers', priority: 0.8, changefreq: 'weekly' },
];

// Minimum URL count enforced by build-sitemap.mjs. Bump as routes grow.
export const MIN_SITEMAP_URLS = 3;

// IndexNow key — value matches the public/<key>.txt filename. Rotating
// requires renaming the .txt file AND updating this constant in the
// same commit.
export const INDEXNOW_KEY = '00b81fad70da4ae7acdbfd756d25c510';
