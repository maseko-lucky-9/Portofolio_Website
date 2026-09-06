# Ambient background field — asset slot

Nothing ships from this directory yet. `FieldBackground` HEAD-probes `scene.json`; while it is
absent the page renders the CSS gradient fallback (`#field-fallback`) and never fetches the
runtime. That is a supported state, not a broken one — the site is complete without it.

## Expected files

| File | Source |
|---|---|
| `unicornStudio.umd.js` | `https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v<VERSION>/dist/unicornStudio.umd.js` |
| `scene.json` | The project JSON exported from **our own** Unicorn Studio account |

`<VERSION>` **must** be the version in the embed snippet Unicorn Studio shows for that project.
A scene exported by a newer editor can use layer types an older runtime cannot compile, and the
failure is a blank canvas with a console warning, not an error.

## Why the scene is ours and not the template's

The runtime is proprietary (`hiunicornstudio/unicornstudio.js` ships a custom licence: no use
"with non-Unicorn Studio projects", no derivative works). Self-hosting an exported project JSON
and pointing `data-us-project-src` at it is the documented, supported path — for a project in
your own account. The design-reference template's scene is someone else's project, so it is used
only as a visual target and a rebuild recipe (`~/.claude/plans/aura-signal-field-src/field-recipe.md`),
never shipped.

## Alternative: CDN-hosted scene

If JSON export is not available on the account's plan, `FieldBackground` can switch to
`data-us-project="<project-id>"` and let the runtime fetch the scene from Unicorn's CDN. That adds
the CDN origin to `connect-src` in both `nginx.conf` and `src/worker.ts`; find the exact origin
with `grep -o 'https://[a-z.]*unicorn[a-z.]*' unicornStudio.umd.js`.

## Checks before committing either file

```bash
grep -cE '\beval\(|new Function\(' unicornStudio.umd.js   # must be 0 — production CSP has no 'unsafe-eval'
grep -c 'paused' unicornStudio.umd.js                     # must be >0 — reduced motion holds a static frame
node -e "const s=require('./scene.json');console.log(Array.isArray(s.history), JSON.stringify(s).match(/https?:\/\/[^\"]+/g))"
```

The last line must print `true null`: any remote URL in the scene needs a CSP entry, or the
layer silently renders empty.
