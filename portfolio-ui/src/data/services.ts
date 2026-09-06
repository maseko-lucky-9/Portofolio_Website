/**
 * The three engagement types.
 *
 * Moved out of ServicesSection.tsx, where it was inline, so the copy sits with
 * the rest of the content and can be asserted against the JSON-LD offer catalog
 * in index.html — the two drifted apart while this lived in the component, and
 * nothing in CI notices (Lighthouse has structured-data off).
 *
 * No prices, no tiers, no "most popular" flag: there is no pricing data behind
 * this site, and ranking your own three service lines invents a commercial
 * hierarchy nothing supports.
 */
export interface Service {
  id: "k8s-ops" | "iac" | "backend";
  /** Mono micro-label above the name. */
  eyebrow: string;
  name: string;
  body: string;
  /** What the engagement actually covers — each line traceable to real work. */
  caps: string[];
  tech: string[];
}

export const services: Service[] = [
  {
    id: "k8s-ops",
    eyebrow: "K8S-OPS",
    name: "Kubernetes Platform Operations",
    body: "Production cluster design, GitOps delivery and the day-two operations that keep it running — upgrades, secret rotation, multi-tenant isolation, golden-signal SLOs.",
    caps: [
      "Cluster design and migration (EKS, MicroK8s)",
      "ArgoCD App-of-Apps delivery",
      "External Secrets + Vault integration",
      "Prometheus / Grafana / Loki observability",
    ],
    tech: ["Kubernetes", "ArgoCD", "Helm", "Prometheus"],
  },
  {
    id: "iac",
    eyebrow: "IAC",
    name: "Infrastructure as Code",
    body: "Terraform modules and CI pipelines that make an environment reproducible from a clean account, with the drift and state-management practices that keep it that way.",
    caps: [
      "Terraform module authoring and review",
      "GitHub Actions / Azure DevOps pipelines",
      "State backend and drift management",
      "Environment promotion workflows",
    ],
    tech: ["Terraform", "GitHub Actions", "AWS", "Azure"],
  },
  {
    id: "backend",
    eyebrow: "BACKEND",
    name: ".NET & Java Microservices",
    body: "Service-oriented rewrites of legacy monoliths for regulated environments — event-driven, idempotent, and auditable, with the test coverage a bank will accept.",
    caps: [
      "Monolith-to-microservice decomposition",
      "Kafka event pipelines and transactional outbox",
      "REST API design and versioning",
      "Testcontainers integration coverage",
    ],
    tech: [".NET 9", "Spring Boot 4", "Kafka", "PostgreSQL"],
  },
];
