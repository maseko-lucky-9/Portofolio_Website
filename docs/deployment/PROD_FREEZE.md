# Homelab `prod` namespace — frozen

**Status:** frozen as of the commit that introduced this file.
**Reason:** the homelab is being repurposed as a dev-only environment. Production is the
Cloudflare Workers deploy of `portfolio-ui`; the homelab `prod` namespace no longer receives
deploys.

## What "frozen" means here

Automated ArgoCD sync is **off** on all five Applications. Before this change, four of them
would auto-sync, which meant a promoted commit could mutate the live `prod` namespace even
though no CD workflow targeted it:

| Application | File | Was | Now |
|---|---|---|---|
| `frontend-apps` | [portfolio-ui/k8s/argocd/app-of-apps.yaml](../../portfolio-ui/k8s/argocd/app-of-apps.yaml) | `prune: true`, `selfHeal: true` | manual |
| `backend-app-of-apps` | [portfolio-api/k8s/argocd/backend-app-of-apps.yaml](../../portfolio-api/k8s/argocd/backend-app-of-apps.yaml) | `selfHeal: true` | manual |
| `backend-prod` | [portfolio-api/k8s/argocd/backend-prod.yaml](../../portfolio-api/k8s/argocd/backend-prod.yaml) | `automated` (mislabelled "Manual sync") | manual |
| `backend-database-prod` | [portfolio-api/k8s/argocd/backend-database-apps.yaml](../../portfolio-api/k8s/argocd/backend-database-apps.yaml) | `automated` | manual |
| `frontend-prod` | [portfolio-ui/k8s/argocd/application-prod.yaml](../../portfolio-ui/k8s/argocd/application-prod.yaml) | already manual | manual |

Two subtleties that made this non-obvious:

- **`automated` auto-syncs on new git revisions.** `prune: false` + `selfHeal: false` only
  suppress *drift*-triggered syncs. `backend-prod` carried a `# Manual sync for production`
  comment directly above an active `automated:` block.
- **`backend-database-prod` syncs `portfolio-api/k8s/base`** — the same base the new dev
  overlay builds on. Any base edit needed to make dev work would have auto-applied to the
  production database.

## Data-loss path that is now closed

`frontend-apps` managed `path: portfolio-ui/k8s/argocd` with `prune: true`, and `frontend-prod`
carries `resources-finalizer.argocd.argoproj.io`. Deleting or renaming an Application file in
that directory would make ArgoCD prune the child Application, whose finalizer then
**cascade-deletes the live resources it manages, including the prod Postgres PVC** — triggered
by an ordinary git refactor, with nobody running `kubectl delete`.

**Never run `kubectl delete application frontend-prod`** (or `frontend-apps`) while the
finalizer is present.

## Accepted risk

The `prod` namespace is **frozen, not deleted**. It keeps running and stays reachable at
`portfolio.homelab` and `api.portfolio.homelab`, but it no longer receives image rebuilds,
Trivy scans, or dependency patches. Its exposure window is therefore unbounded.

This is accepted deliberately and temporarily. Half-alive is the worst of the three states —
resolve it by scheduling the teardown below.

## Consequence if prod is ever un-frozen

The shared bases moved from the deprecated `commonLabels` to `labels` with
`includeSelectors: false`. That was required: `commonLabels` injects into **selector**
fields, including NetworkPolicy `podSelector` peers, which silently rewrote e.g. the Postgres
ingress peer from `{app: backend-api}` to `{app: backend-api, app.kubernetes.io/name: postgres}`
— matching no pod. Every data-layer NetworkPolicy peer was therefore inert, and the
frontend→API egress rule was broken the same way.

Side effect: `spec.selector` on the prod Deployments/StatefulSet renders differently now
(e.g. `{app: frontend}` rather than the label-injected superset). **`spec.selector` is
immutable**, so syncing this into the *existing* prod workloads would fail with an
immutable-field error. Nothing applies it while the freeze holds. If prod is ever resumed,
those workloads must be deleted and recreated (`kubectl delete deployment --cascade=orphan`
then re-apply, so pods survive the swap).

## Steps still requiring cluster access

These could not be run when the freeze landed (homelab unreachable over Tailscale). Run them
when the cluster is back:

```bash
# 1. Confirm the Applications actually took the manual policy
kubectl get application -n argocd -o custom-columns=\
NAME:.metadata.name,AUTO:.spec.syncPolicy.automated,REV:.spec.source.targetRevision

# 2. Back up the prod database BEFORE any teardown work
kubectl exec -n prod "$(kubectl get pod -n prod -l app=postgres -o name | head -1)" \
  -- pg_dumpall -U postgres > "prod-$(date +%F).sql"

# 3. Record node capacity — needed before the dev stack is sized (see the split plan)
kubectl describe node | grep -A8 'Allocated resources'
df -h /
```

## Optional hardening: pin to an immutable revision

The freeze relies on `automated` being absent, so no git push can trigger a sync. A **manual**
sync would still pull whatever `main` holds. To close that too, pin the Applications to a tag.

Deliberately not done in the freeze commit: if the manifests reference a tag that is not yet on
the remote, ArgoCD reports `ComparisonError` — the tag must be pushed *first*.

```bash
git tag v-prod-freeze-$(git rev-parse --short HEAD)
git push origin v-prod-freeze-<sha>          # push BEFORE editing the manifests
# then set targetRevision: v-prod-freeze-<sha> in all five Applications
```

## Teardown (when ready to retire prod for good)

Order matters — the finalizer makes step 3 destructive.

```bash
kubectl exec -n prod <postgres-pod> -- pg_dumpall -U postgres > prod-final.sql   # 1. back up
kubectl patch application frontend-prod -n argocd --type=json \
  -p '[{"op":"remove","path":"/metadata/finalizers"}]'                            # 2. defuse
kubectl patch application frontend-apps -n argocd --type=json \
  -p '[{"op":"remove","path":"/metadata/finalizers"}]'
kubectl delete application frontend-prod backend-prod backend-database-prod -n argocd  # 3.
kubectl delete namespace prod                                                     # 4.
```
