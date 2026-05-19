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
  // Phase 2: uncomment as the prerendered routes land.
  // { path: '/about', priority: 0.9, changefreq: 'monthly' },
  // { path: '/projects', priority: 0.9, changefreq: 'weekly' },
  // { path: '/services', priority: 0.8, changefreq: 'monthly' },
  // { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  // { path: '/answers', priority: 0.8, changefreq: 'weekly' },
  // { path: '/contact', priority: 0.6, changefreq: 'yearly' },
];

// Minimum URL count enforced by build-sitemap.mjs. Bump this as routes
// are added — drops below it fail the build, surfacing accidental
// regressions instead of silently shipping a thin sitemap.
export const MIN_SITEMAP_URLS = 1;

// IndexNow key — value matches the public/<key>.txt filename. Rotating
// requires renaming the .txt file AND updating this constant in the
// same commit.
export const INDEXNOW_KEY = '00b81fad70da4ae7acdbfd756d25c510';
