# Off-Site SEO Checklist

Sequence backlinks low-effort → high-effort. Run weekly during the first month, then quarterly.

## Tier 1 — Owned profiles (do first, all free)

- [ ] GitHub profile README links to `https://thulanimaseko.co.za/`.
- [ ] GitHub profile **Website** field set to `https://thulanimaseko.co.za/`.
- [ ] Each public repo's `homepage` field set on relevant projects.
- [ ] LinkedIn **Personal website** field set.
- [ ] LinkedIn **Featured** section pins the site.
- [ ] Twitter/X profile URL.
- [ ] Bluesky profile.
- [ ] Mastodon profile (rel="me" verified — adds the green-check badge).
- [ ] Dev.to profile **Website** field.
- [ ] Hashnode profile **Website** field.

## Tier 2 — Content syndication (canonical-tagged)

When a long-form post ships at `/answers/<slug>` or `/blog/<slug>`:

- [ ] Cross-post to Dev.to with `canonical_url` frontmatter set to the original.
- [ ] Cross-post to Hashnode with canonical URL set.
- [ ] Cross-post to Medium with **Story → More → Edit story details → Add canonical link**.
- [ ] Submit to /r/programming, /r/devops, /r/kubernetes (subreddit-relevant only — avoid spam).
- [ ] Submit to Hacker News if topical.
- [ ] Submit to Lobsters if invited.
- [ ] Pin tweet/skeet linking the post.

Canonical tags prevent duplicate-content penalties; the originals still accrue authority.

## Tier 3 — Directories + communities

ZA-relevant first (geo-targeting boost), then global:

- [ ] **OfferZen** profile (ZA dev marketplace, high SEO authority).
- [ ] **Codable** ZA freelancer directory.
- [ ] **Awwwards** site submission (if the design qualifies).
- [ ] **Indie Hackers** profile.
- [ ] **GitHub topics** — tag own repos with relevant topics for discovery.
- [ ] **Stack Overflow** profile **Website** field (requires 30+ rep on the account).

## Tier 4 — Reciprocal + earned links

- [ ] Reach out to 3–5 ZA dev communities (Cape Town Tech Slack, JoziJS) for a guest mention.
- [ ] Sponsor an open-source project the site already uses (reciprocal backlink in their sponsors page).
- [ ] Write a `/answers/` post that solves a specific obscure problem; share in the relevant project's GitHub Discussions for natural inbound links.

## Avoid

- ❌ Paid backlink packages, "PBN" networks, fiverr SEO services.
- ❌ Reciprocal-link rings.
- ❌ Comment-spam on unrelated blogs.
- ❌ Cross-posting without canonical tags (kills the original's authority).

## Tracking

Log new backlinks monthly in this file under a `## Acquired` heading with date + source. Use Ahrefs/Semrush *backlink check* via their free public tools (or Search Console's **Links** report) to monitor inbound — note: those services' crawlers are blocked from indexing our content, which is fine; their backlink databases are populated from other sites' crawl data.
