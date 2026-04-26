/**
 * =============================================
 * PROJECTS DATA CONFIGURATION
 * =============================================
 * Greenfield portfolio builds for the Prudentia Digital freelance launch.
 * Phase 2 shortlist from wiki/career/project/portfolio-projects-shortlist.md.
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
  // Project 2: AWS EKS Terraform module (planned)
  {
    id: "terraform-aws-eks-opinionated",
    title: "AWS EKS Terraform Module — Opinionated",
    tagline: "Sane defaults. Multi-env. OPA-guarded.",
    description:
      "Production-ready Terraform module for AWS EKS, published to the public Terraform Registry. Multi-environment (dev/staging/prod), IRSA, optional Karpenter, and OPA policy guardrails baked in.",
    thumbnail: "/images/projects/terraform-aws-eks.png",
    technologies: [
      "Terraform",
      "AWS EKS",
      "Karpenter",
      "IRSA",
      "OPA",
      "GitHub Actions",
      "Atlantis",
    ],
    challenge:
      "Most public Terraform EKS modules are either too thin (toy clusters) or too kitchen-sink (unused features bloat the blast radius). Need a module that codifies a sensible production baseline.",
    solution:
      "VPC + private/public subnets (or BYO-VPC), EKS with managed node groups or Karpenter, IRSA for service accounts, OIDC provider, optional add-ons (cert-manager, ESO, ArgoCD, ALB controller). Multi-env tfvars templates plus OPA policies on critical resources.",
    impact:
      "Clients adopt the module to skip 2 weeks of bootstrapping and inherit production defaults. Public Terraform Registry visibility provides independent third-party validation.",
    githubUrl: "https://github.com/maseko-lucky-9/terraform-aws-eks-opinionated",
    featured: true,
  },
  // Project 3: .NET microservices + Kafka (planned)
  {
    id: "dotnet-events",
    title: ".NET Microservices + Kafka Event-Driven Backend",
    tagline: "Reliable messaging at scale.",
    description:
      "Greenfield ASP.NET Core 9 microservices with MassTransit + Apache Kafka, transactional outbox pattern, OpenTelemetry distributed tracing, xUnit + Testcontainers integration tests, deployed via Helm to the K8s reference cluster.",
    thumbnail: "/images/projects/dotnet-events.png",
    technologies: [
      ".NET 9",
      "ASP.NET Core",
      "Apache Kafka",
      "MassTransit",
      "PostgreSQL",
      "OpenTelemetry",
      "Helm",
      "Docker",
    ],
    challenge:
      "Show what production .NET event-driven backends look like — the kind I ship inside banks — without leaking any prior-employer code or data. Reliable messaging, tested, observable, deployable.",
    solution:
      "Producers and consumers via MassTransit, transactional outbox for at-least-once delivery, OpenTelemetry traces propagated through Kafka headers, integration tests using Testcontainers, Helm chart for K8s deploy.",
    impact:
      "Throughput > 5k messages/sec on commodity hardware; zero message loss across simulated broker failures; sub-second p95 end-to-end trace visibility.",
    githubUrl: "https://github.com/maseko-lucky-9/dotnet-events",
    featured: true,
  },
  // Project 4: RAG + MCP server (planned, deferable)
  {
    id: "rag-mcp-demo",
    title: "RAG Pipeline + MCP Server Demo",
    tagline: "Production-grade AI integration.",
    description:
      "pgvector-backed retrieval-augmented generation pipeline served via the Model Context Protocol — designed for Claude/agent integration with measurable accuracy and latency benchmarks.",
    thumbnail: "/images/projects/rag-mcp.png",
    technologies: ["Python", "pgvector", "PostgreSQL", "MCP", "Anthropic Claude", "FastAPI", "Docker"],
    challenge:
      "Most RAG demos ship as notebooks. Need a production-pattern reference: ingestion pipeline, embedding store, retrieval API, MCP server interface, with explicit accuracy/latency SLOs.",
    solution:
      "Document chunking + embedding pipeline (sentence-transformers), pgvector indexed retrieval, FastAPI service exposing MCP-compatible tool/resource endpoints, evaluation harness measuring retrieval recall and answer quality.",
    impact:
      "Retrieval recall@10 > 85% on a public benchmark; p95 query latency < 500 ms; MCP server consumable directly from Claude Code or any MCP client.",
    githubUrl: "https://github.com/maseko-lucky-9/rag-mcp-demo",
    featured: false,
  },
];

// All unique technologies for filtering
export const allTechnologies = [...new Set(projects.flatMap((p) => p.technologies))].sort();
