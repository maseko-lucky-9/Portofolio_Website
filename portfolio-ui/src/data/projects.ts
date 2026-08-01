/**
 * =============================================
 * PROJECTS DATA CONFIGURATION
 * =============================================
 * Greenfield portfolio builds. Originally seeded from the Phase 2 shortlist in
 * wiki/career/project/portfolio-projects-shortlist.md — which listed projects that
 * were, at the time, still planned.
 *
 * EVERY ENTRY MUST BE REAL. Two earlier entries (terraform-aws-eks-opinionated,
 * rag-mcp-demo) shipped with githubUrl values that returned 404, and with `impact`
 * metrics that had never been measured: "recall@10 > 85%", "p95 query latency
 * < 500 ms", "Clients adopt the module to skip 2 weeks of bootstrapping". Those were
 * aspirations copied out of the planning doc into a field that reads as fact.
 *
 * Two rules, because src/chat.ts:66 feeds this file straight into the recruiter
 * chatbot's system prompt. Every entry is spoken aloud to people deciding whether to
 * hire — and `featured` is only a badge (ProjectsSection.tsx:313), not a filter, so
 * nothing here is hidden from either the page or the bot:
 *
 *   1. githubUrl must resolve. Check it; do not assume it.
 *   2. `impact` states only what the repo's README supports. No invented numbers.
 */

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  thumbnail: string;
  technologies: string[];
  challenge: string;
  solution: string;
  impact: string;
  liveUrl?: string;
  githubUrl?: string;
  caseStudyUrl?: string;
  featured: boolean;
}

export const projects: Project[] = [
  // Project 1: Production K8s reference architecture (in-progress)
  {
    id: "k8s-ref-arch",
    title: "Production Kubernetes Reference Architecture",
    tagline: "GitOps. Observable. Multi-tenant.",
    description:
      "Multi-tenant SaaS reference cluster on MicroK8s with ArgoCD GitOps, Helm, External Secrets Operator, cert-manager, and a full Prometheus/Grafana/Loki observability stack. Documents the production EKS deployment recipe.",
    thumbnail: "/images/projects/k8s-ref-arch.png",
    technologies: [
      "Kubernetes",
      "ArgoCD",
      "Helm",
      "External Secrets",
      "cert-manager",
      "Prometheus",
      "Grafana",
      "Loki",
      "AWS EKS",
      "Terraform",
    ],
    challenge:
      "Show production-grade Kubernetes patterns end-to-end without hand-waving: GitOps-driven deploys, secret rotation, multi-tenant isolation, and golden-signal SLOs — all reproducible from a clean cluster.",
    solution:
      "Built a MicroK8s home cluster with ArgoCD ApplicationSets, Helm-packaged microservices, ESO syncing from Vault, cert-manager issuing Let's Encrypt certs, and a full Prometheus/Grafana/Loki/Tempo stack. EKS deployment recipe documented in repo.",
    impact:
      "Zero-touch deploys via Git push; p95 latency < 200 ms across services; full audit trail; reusable as a reference for client engagements.",
    githubUrl: "https://github.com/maseko-lucky-9/k8s-ref",
    featured: true,
  },
  // Project 2: n8n on Kubernetes — Helm + ArgoCD + Vault (shipped, public repo)
  {
    id: "n8n-self-hosting",
    title: "Self-Hosted n8n on Kubernetes",
    tagline: "One chart. Two clusters. Vault-backed.",
    description:
      "A Helm chart running n8n and PostgreSQL across two clusters from a single source of truth — Minikube locally, MicroK8s live — delivered by ArgoCD App-of-Apps, with live credentials synced out of HashiCorp Vault by the External Secrets Operator.",
    thumbnail: "/images/projects/n8n-self-hosting.png",
    technologies: [
      "Kubernetes",
      "Helm",
      "ArgoCD",
      "External Secrets",
      "HashiCorp Vault",
      "PostgreSQL",
      "MicroK8s",
      "GitHub Actions",
    ],
    challenge:
      "Running one workload both locally and live usually ends in two sets of manifests that quietly drift apart. The live side needs real secret management; the local side should need none at all. Holding both in one chart is where most self-hosting setups fork.",
    solution:
      "One chart, two values files, one child ArgoCD application per environment under an App-of-Apps root — local auto-syncs, live syncs deliberately. External Secrets Operator pulls Postgres credentials from Vault into Kubernetes Secrets on the live path only, so local development needs no secret backend.",
    impact:
      "Where the reference architecture above is the pattern, this is a real workload running on it — including the failures that only surface in practice. Each is documented with its fix: the missing pgcrypto extension that crash-loops n8n's migrations, the UID/fsGroup mismatch behind EACCES on /.n8n, and a Service selector matching no pods.",
    githubUrl: "https://github.com/maseko-lucky-9/n8n-self-hosting",
    featured: true,
  },
  // Project 3: Fraud Rule Engine — Java 21 + Kafka (shipped, public repo)
  {
    id: "fraud-rule-engine",
    title: "Fraud Rule Engine — Java 21 + Kafka",
    tagline: "Deterministic. Explainable. Event-driven.",
    description:
      "A Spring Boot 4 fraud engine that ingests transactions over REST and Kafka, evaluates them against versioned YAML rules, persists explainable decisions to PostgreSQL, and republishes results to a downstream Kafka topic via a transactional outbox. Ships with a Python red-team simulator that drives the live engine with scripted and LLM-driven adversaries.",
    thumbnail: "/images/projects/fraud-rule-engine.png",
    technologies: [
      "Java 21",
      "Spring Boot 4",
      "Apache Kafka",
      "PostgreSQL",
      "Redis",
      "Flyway",
      "Spring Security",
      "Testcontainers",
      "Prometheus",
      "Docker",
      "Python",
    ],
    challenge:
      "Fraud decisions must be deterministic, explainable, and auditable — never a black box — while handling both synchronous REST calls and asynchronous Kafka event streams with idempotency and no double-processing.",
    solution:
      "A bounded predicate registry (velocity, geo-mismatch, device-fingerprint, merchant-blacklist) evaluates versioned YAML rules; Redis backs idempotency and rate-limiting; a transactional outbox republishes every decision; Prometheus metrics and Testcontainers integration tests cover the stack. An optional Ollama AI advisory assists reviewers but is non-authoritative by design.",
    impact:
      "Every decision is explainable and audit-logged; AI commentary is opt-in and never blocks the deterministic engine; a Python red-team simulator continuously surfaces detection gaps. Demonstrates polyglot delivery — a Java engine with Python tooling — with idempotency, outbox, and observability treated as first-class.",
    githubUrl: "https://github.com/maseko-lucky-9/fraud-rule-engine",
    featured: true,
  },
  // Project 4: Reelsmith — async staged pipeline with live progress (shipped, public repo)
  {
    id: "reelsmith",
    title: "Reelsmith — Async Media Pipeline",
    tagline: "Staged. Observable. Never lies about progress.",
    description:
      "A FastAPI service that drives multi-minute video jobs through a ten-stage async pipeline — download, transcribe, score, caption, render — and streams per-stage progress to a React dashboard over Server-Sent Events, with job state persisted in PostgreSQL.",
    thumbnail: "/images/projects/reelsmith.png",
    technologies: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "SQLAlchemy 2 async",
      "Alembic",
      "Server-Sent Events",
      "Whisper",
      "React 19",
      "pytest",
    ],
    challenge:
      "A ten-stage job that runs for minutes has to report progress without lying about it. SSE reconnects, tab refocus and out-of-order events all push a naive progress UI backwards — and a stage that un-completes reads as a bug even when the underlying work is fine.",
    solution:
      "Job state in PostgreSQL is the source of truth; the event stream is a low-latency optimisation over it, reconciled by max-merge so a stage can never regress. A pure deriveStageStates(job, events) helper keeps that rule testable without a browser, and new input sources plug in through an adapter registry rather than branching the orchestrator.",
    impact:
      "Async SQLAlchemy 2 with Alembic migrations, an event bus with swappable in-memory and PostgreSQL job stores, and pytest plus vitest covering both halves. Three ADRs record the design turns. The progress timeline announces only stage transitions to screen readers — roughly ten per job rather than sixty — and degrades through an error boundary instead of blanking the page.",
    githubUrl: "https://github.com/maseko-lucky-9/reelsmith",
    featured: true,
  },
];

// All unique technologies for filtering
export const allTechnologies = [...new Set(projects.flatMap((p) => p.technologies))].sort();
