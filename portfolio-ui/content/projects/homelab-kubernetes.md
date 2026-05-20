---
title: "Homelab Kubernetes: MicroK8s + ArgoCD on a single box"
description: "A pragmatic single-node Kubernetes setup for personal projects: MicroK8s for the runtime, ArgoCD for GitOps, Cloudflare Tunnel for ingress, no cloud bill."
datePublished: "2026-02-15T10:00:00+02:00"
programmingLanguages:
  - YAML
  - Helm
  - Shell
codeRepository: "https://github.com/maseko-lucky-9/homelab-infra"
runtimePlatform: "MicroK8s"
keywords:
  - kubernetes
  - microk8s
  - argocd
  - gitops
  - homelab
  - cloudflare
---

Personal Kubernetes that's actually fun to operate. Single 32 GB box, MicroK8s as the runtime, ArgoCD for GitOps, Cloudflare Tunnel for ingress so I don't open ports on my home network. Has been running since late 2025 with the only manual intervention being kernel updates.

## Why MicroK8s

Three constraints made it the only sensible pick:

1. **Single-node** for cost and noise — k3s and MicroK8s both fit. k3s is slimmer; MicroK8s ships with batteries (ingress-nginx, MetalLB, observability stack via add-ons).
2. **Add-on philosophy** — `microk8s enable argocd` is one command, vs hand-rolling a k3s ArgoCD install. Saves the early-stage friction.
3. **Snap-managed updates** — boring infrastructure should auto-update. MicroK8s does; k3s with k3sup is more manual.

## Architecture

```
┌──────────────────────────────────────────────┐
│         Single host (Ubuntu LTS, 32 GB)      │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  MicroK8s                              │  │
│  │  ├── ArgoCD (GitOps controller)        │  │
│  │  ├── ingress-nginx (north-south)       │  │
│  │  ├── cert-manager (Let's Encrypt)      │  │
│  │  ├── External Secrets (HashiCorp Vault)│  │
│  │  └── Observability                     │  │
│  │      ├── Prometheus + Grafana          │  │
│  │      └── Loki + Promtail               │  │
│  └────────────────────────────────────────┘  │
│             ▲                                │
│             │ encrypted tunnel               │
│             ▼                                │
└─────[Cloudflare Tunnel]──────────────────────┘
                  │
                  ▼
            Public internet
```

No public ports on the home router; all ingress arrives through `cloudflared` over an outbound mTLS connection to Cloudflare's edge.

## GitOps loop

Everything in `~/Repo/homelab-infra`:

- `argocd/applications/*.yaml` — one `Application` per workload.
- `argocd/applicationsets/*.yaml` — templated apps (e.g., per-environment overlays).
- `clusters/homelab/values/*.yaml` — Helm values per workload, env-specific.

ArgoCD watches the repo every 3 minutes. Commit pushed -> ArgoCD reconciles within ~3 minutes. The dashboard at `https://argocd.homelab.thulanimaseko.com` shows sync status and a manual sync button for when I want it faster.

## What runs on it

Five workloads as of writing:

| Workload | Purpose |
|---|---|
| Plausible | Self-hosted analytics for portfolio + Prudentia Digital |
| Vault | Secret backend for the cluster + dev work |
| HomeAssistant | Lights, climate, observability |
| n8n | Workflow automation (RSS scraping, scheduled jobs) |
| Postgres | Shared DB for the above |

## What I learned

The biggest unlock was treating it like a real cluster: helm charts, env-specific values, ArgoCD Application syncing — not a pile of `kubectl apply` scripts. The discipline scales: when I bring up a second cluster (planned: EKS for paid work), the GitOps repo just gets a new `clusters/eks-prod/` directory and the rest is identical.

## See also

- [Repo](https://github.com/maseko-lucky-9/homelab-infra)
- [/answers/argocd-vs-flux-2026](/answers/argocd-vs-flux-2026) — why ArgoCD and not Flux
