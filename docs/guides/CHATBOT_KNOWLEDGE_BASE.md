# Chatbot knowledge base — Google Docs setup

The recruiter chatbot (`POST /api/chat`, see `portfolio-ui/src/chat.ts`) answers from two
sources:

1. **`portfolio-ui/src/data/*.ts`** — imported directly, so the bot can never drift from what
   the page renders. This already works with no setup.
2. **Two Google Docs** — pulled at author-time by `npm run kb:refresh`. This guide sets those up.

Until step 6 is done, `src/generated/knowledge.ts` holds empty strings and the bot runs on the
structured site data alone. It works; it just knows less.

---

## ⚠️ Read this before you write a word

**`Portofolio_Website` is a public repo, and `src/generated/knowledge.ts` is committed to it.**
Git history is effectively permanent — GitHub retains unreachable blobs and mirrors scrape
public repos within hours. There is no meaningful "undo" after a push.

**Do not put these in either document:**

| Never | Why |
|---|---|
| ID number, date of birth | Identity-fraud set when combined with your name |
| Home address | Same |
| Personal phone number | Harvested at scale |
| **Referee names and contact details** | This is *someone else's* personal information. You cannot consent on their behalf. Under POPIA this is the sharpest exposure in the whole feature. |
| Salary expectation, current package, notice period | The bot is instructed to route these to email anyway — putting them in writing publicly removes your negotiating position |
| Anything from an employer under NDA | Capitec is a regulated bank |

`portfolio-ui/src/lib/kb-patterns.mjs` holds the detection rules, shared by the refresh
script and the Worker's hourly sync, and mirrored by hand in `.gitleaks.toml`. A hit
**fails the refresh** rather than writing anything. It covers SA ID numbers (Luhn-checked),
phone numbers including landlines and every separator Google Docs emits, email addresses,
identity field labels, street addresses and unlabelled dates of birth.

**They are backstops, not permission.** They cannot detect a home address written in prose
or a referee named without contact details. And note the earlier version of this gate
allowed a *space* but not a *hyphen* between digit groups — so the real CV's phone number
passed all three gates at once. It is fixed and tested, but the lesson holds: the gate is
the last line, not the first.

**They match field *labels* as well as values.** Write "South African citizen", never
"Nationality: South African" — the second form fails the refresh with no personal
information actually present.

**Rule of thumb: if you would not put it on the public homepage, it does not go in these docs.**

---

## Step 1 — Create the two documents

### Doc A — "Thulani Maseko — Professional History"

This is the authoritative employment narrative. It is what the bot prefers when it disagrees
with the site summary (rule 8 of the system prompt), and it is also what recruiters download as
`resume.pdf`.

Write it as a normal CV **minus the identity block**. A useful shape:

```
Thulani Maseko
Senior Backend & DevOps / Kubernetes Engineer
Gauteng, South Africa · ltmaseko7@gmail.com
github.com/maseko-lucky-9 · linkedin.com/in/thulani-maseko-819587127

SUMMARY
2–4 sentences. What you build, for whom, at what scale.

EXPERIENCE
Capitec Bank — Software Developer (Jun 2023 – Present), Sandton
  Context: what the team owned, how big, what the stakes were.
  - Achievement with a number in it wherever you have one.
  Tech: ...

[repeat per role — match the dates in src/data/experience.ts exactly]

CERTIFICATIONS
Microsoft Certified: Azure Developer Associate (year)

EDUCATION
Institution, qualification, year.
```

**Numbers are what make this worth doing.** "Migrated on-premises applications to EKS" is
already in `experience.ts`. "Cut deploy time from 40 minutes to 4, across 12 services" is not,
and it is the kind of thing a recruiter repeats to a hiring manager.

### Doc B — "Recruiter Brief"

Short — 300–600 words. This carries what the site deliberately does not say, and it is the
document that makes the bot genuinely useful on a first call. Suggested headings:

```
AVAILABILITY
Contract / permanent / both. Remote, hybrid, or onsite. Which regions or time zones.
Whether you are actively looking or only open to the right thing.

WHAT I AM LOOKING FOR
Platform / DevOps / backend. Company size and domain you do well in. What you want more of.

WHAT I AM NOT LOOKING FOR
Saves everyone a call. Be direct.

STRENGTHS, IN MY OWN WORDS
Where you are genuinely senior vs. competent-but-not-deep. Recruiters ask
"how strong is he really on X" — answer it here rather than letting a
proficiency number in skills.ts imply something you would not defend.

DOMAIN CONTEXT
South African banking / fintech: regulatory environment, scale, why it is
non-trivial. Most recruiters will not know this.

WORK AUTHORISATION
"South African citizen" is enough. No ID number.

FAQ
3–6 questions you are tired of answering on first calls, with the answers.
```

Leave rate, package, and notice period out. The bot refuses those by design and points at
email — which is where that conversation belongs.

---

## Step 2 — Make both link-viewable

In each doc: **Share → General access → "Anyone with the link" → Viewer**.

This is required — the export endpoint is unauthenticated, which is the whole reason no API key
or OAuth service account is needed. Anyone holding the document ID can read it, so treat both
documents as published the moment you do this.

Do **not** use "Publish to the web" — that is a different feature and produces a different URL.

---

## Step 3 — Get the document IDs

From the browser URL:

```
https://docs.google.com/document/d/1a2B3cD4eF5gH6iJ7kL8mN9oP0qR/edit
                                  └──────── this is the ID ────────┘
```

## Step 4 — Create `.env` at the repo root

Repo **root** (`portfolio-website/.env`), not inside `portfolio-ui/` — the npm script reads
`../.env` relative to its own working directory.

```bash
GDOC_CV_ID=1a2B3cD4eF5gH6iJ7kL8mN9oP0qR
GDOC_BRIEF_ID=9z8Y7xW6vU5tS4rQ3pO2nM1lK0j
```

`.env` is already gitignored (`.gitignore:12`). Never commit it — not because the IDs are
secret exactly, but because a committed ID makes the document permanently and unrevokably
public, including every future edit, live, with no deploy step in between.

## Step 5 — Install `exiftool` (one-off)

```bash
brew install exiftool
```

PDF metadata (`Author`, `Creator`) survives Google Docs export and carries your Google account
identity. The script strips it. **Without exiftool the script deletes the PDF rather than
committing an unstripped one** — you get the knowledge base but not the résumé download fix.

## Step 6 — Run the refresh

```bash
cd portfolio-ui && npm run kb:refresh
```

Expected output:

```
✓ knowledge.ts — CV 4182 chars, brief 1533 chars
✓ public/resume.pdf (metadata stripped)
```

## Step 7 — Review, then ship

**Read the generated file before committing it.** This is the text the bot will speak from, on
your behalf, to people deciding whether to hire you:

```bash
git diff portfolio-ui/src/generated/knowledge.ts
```

Then:

```bash
git checkout -b chore/knowledge-base
git add portfolio-ui/src/generated/knowledge.ts portfolio-ui/public/resume.pdf
git commit -m "chore(chat): populate knowledge base from Google Docs"
git push -u origin chore/knowledge-base && gh pr create --fill
```

Merging to `main` triggers `cloudflare-cd.yml`, which redeploys the Worker. Give it ~2 minutes,
then sanity-check production:

```bash
curl -sN -X POST https://thulani-portfolio.masekotlg.workers.dev/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"Is he available for contract work?"}]}'
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `⚠ GDOC_CV_ID / GDOC_BRIEF_ID not set` | `.env` missing, or in `portfolio-ui/` instead of the repo root | Move it to the root |
| `⚠ Google Docs fetch failed (HTTP 404)` | Doc not link-viewable, or wrong ID | Re-check Share settings and the ID from the URL |
| `✗ … contains what looks like personal information` | PII gate tripped — **working as designed** | Remove the flagged field from the doc, re-run. Do not weaken the regex. |
| `⚠ resume.pdf step failed` | exiftool missing | `brew install exiftool` |
| Refresh succeeds, bot still doesn't know | Generated file not committed, or not deployed | `git status`, then check the CD run |
| Bot contradicts the site | Doc and `src/data/experience.ts` disagree | The doc wins by design (rule 8). Fix whichever is wrong. |

## Updating later

Once live sync is enabled (below), **edit the Google Doc and wait** — the Worker picks the
change up on the next hourly cron, with no commit, no PR and no deploy. Allow up to ~65
minutes end to end: the cron runs at `:17` and `readKb` caches for 5 minutes at the edge.

`npm run kb:refresh` is still the path for **`public/resume.pdf`**, which live sync cannot
touch — a Worker cannot rewrite its own static assets, and `exiftool` metadata stripping
cannot run inside one. Serving the PDF from KV would ship your Google account identity in
the PDF `Author` field.

### Enabling live sync

```bash
npx wrangler kv namespace create KB
```

Put the returned id in `portfolio-ui/wrangler.toml` — **the real id, in the first commit.**
`wrangler deploy` fails on a namespace that does not exist, and `cloudflare-cd.yml` runs on
push to `main`, so a placeholder id fails *after* merge when every PR gate has already
passed.

```toml
[[kv_namespaces]]
binding = "KB"
id = "<id from the command above>"

[triggers]
crons = ["17 * * * *"]   # hourly, off the top-of-hour scheduler peak
```

```bash
npx wrangler secret put GDOC_CV_ID
npx wrangler secret put GDOC_BRIEF_ID
```

Secrets, not `[vars]`: a link-viewable document id is a bearer capability for that
document. They persist across deploys, so this is a one-off.

Until all three steps are done the feature is inert and safe — `readKb` returns the
compiled-in constants and `refreshKb` logs `skipped` and does nothing.

---

## ⚠️ If personal information reaches the bot

**Do not un-share the document.** That is the instinctive response and it is the one
action that makes the problem permanent.

An unshared document does not return 404 — Google returns its sign-in page at HTTP 200.
Under naive error handling that reads as "fetch failed, keep serving the last-good value",
which severs the only channel that could ever overwrite the bad content.

This Worker handles it correctly — a sign-in page, a 404 or a 403 is treated as deliberate
withdrawal and **purges** the KV key — but do not rely on the heuristic when you are in a
hurry. In order of preference:

1. **Edit the offending line out of the document.** Next cron publishes the corrected copy.
2. **Replace the entire document body with the single word `PURGE`.** The next run deletes
   the key outright and the bot falls back to `src/data` — it simply knows less.
3. Immediate, if you cannot wait for the cron:
   ```bash
   npx wrangler kv key delete --binding=KB "kb:v1" --remote
   ```

Then check what was live and for how long:

```bash
npx wrangler kv key get --binding=KB "kb:status" --remote
npx wrangler kv key list --binding=KB --prefix "kb:log:" --remote
```

`kb:log:*` entries hold hashes and lengths only, never content, with a 90-day TTL. They
exist because a single mutable KV value cannot answer "what was published, between when
and when" — which `git log` answered for free on the old path, and which POPIA s22 breach
notification depends on when the affected data subject is a referee who never consented.

### Diagnosing a sync that has quietly stopped

The gate fails closed and silently by design. If the bot seems stale:

```bash
npx wrangler kv key get --binding=KB "kb:status" --remote
```

`{"ok":false,"rejected":true,"reason":"personal information detected: …"}` means the gate
is doing its job — fix the document, don't weaken the pattern. `{"ok":false,"reason":"HTTP
503"}` is transient. No `kb:status` at all means the cron has never run: check `[triggers]`
in `wrangler.toml` and that the deploy actually went out.

## Cost

Each message costs ~34 Neurons against a hard free-tier cap of 10,000/day (~290 messages/day).
Making the documents substantially longer raises the per-message cost, because the whole prompt
is re-sent every turn — Workers AI has no prompt caching. Keep the brief tight. If you ever see
error 4006 in Workers Analytics, the first lever is trimming `projects.ts` descriptions
(~1,000 tokens), the second is dropping `experience.ts` once the CV doc covers it.
