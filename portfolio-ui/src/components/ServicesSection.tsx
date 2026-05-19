import { useRef } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import {
  AnimatedBrackets,
  BranchGraph,
  CubeMorph,
} from "@/components/icons/animated";

import { revealOnScroll, useAnime } from "@/lib/use-anime";

interface Service {
  id: string;
  icon: React.ElementType;
  label: string;
  title: string;
  description: string;
  capabilities: string[];
  stack: string[];
  /** Tailwind gradient classes for the icon background */
  gradient: string;
  /** Tailwind border + ring colour on hover */
  accent: string;
}

const services: Service[] = [
  {
    id: "k8s-ops",
    icon: CubeMorph,
    label: "DevOps",
    title: "Kubernetes Operations",
    description:
      "End-to-end cluster lifecycle management — from bootstrap to production-grade GitOps. I build opinionated, observable K8s platforms that teams actually want to use.",
    capabilities: [
      "MicroK8s / EKS cluster setup and hardening",
      "ArgoCD App-of-Apps GitOps pattern",
      "Helm chart authoring and chart museum hosting",
      "Prometheus + Grafana observability stack",
      "Cloudflare Tunnel or ingress-nginx public exposure",
      "External Secrets Operator for secret management",
    ],
    stack: ["Kubernetes", "ArgoCD", "Helm", "Prometheus", "Grafana", "cert-manager"],
    gradient: "from-blue-500/20 to-indigo-500/20",
    accent: "hover:border-blue-500/40",
  },
  {
    id: "iac",
    icon: BranchGraph,
    label: "Infrastructure",
    title: "Terraform / IaC",
    description:
      "Declarative, auditable infrastructure that lives in git alongside application code. I write modular Terraform that can be handed off to a team without ceremony.",
    capabilities: [
      "AWS and Azure resource provisioning",
      "Reusable Terraform module authoring",
      "GitHub Actions / Azure DevOps CI pipelines",
      "State backend configuration (S3, Azure Blob)",
      "Policy-as-code with OPA / Sentinel",
      "Cost estimation and resource tagging strategy",
    ],
    stack: ["Terraform", "Azure", "AWS", "GitHub Actions", "OPA", "Terragrunt"],
    gradient: "from-emerald-500/20 to-teal-500/20",
    accent: "hover:border-emerald-500/40",
  },
  {
    id: "backend",
    icon: AnimatedBrackets,
    label: "Backend",
    title: "Backend Engineering",
    description:
      "Production-grade APIs and microservices in both the JVM and .NET ecosystems — C# / ASP.NET Core and Java / Spring Boot. Clean Architecture, testability, and cloud-native integrations across Azure and AWS.",
    capabilities: [
      "RESTful and gRPC API development (C# & Java)",
      "Spring Boot microservices with Kafka event streaming",
      "Clean Architecture / Domain-Driven Design",
      "Azure Service Bus / Event Hub integrations",
      "Entity Framework Core + JPA/Hibernate with safe migrations",
      "xUnit / JUnit test coverage + OpenTelemetry instrumentation",
    ],
    stack: ["Java", "Spring Boot", "C#", "ASP.NET Core", "Kafka", "Azure", "EF Core", "Docker"],
    gradient: "from-violet-500/20 to-purple-500/20",
    accent: "hover:border-violet-500/40",
  },
];

export function ServicesSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 90 });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      id="services"
      aria-labelledby="services-heading"
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "oklch(var(--muted) / 0.3)" }}
    >
      {/* Top divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.2), transparent)",
        }}
      />

      <div className="section-container !py-0 py-20 md:py-28">
        {/* Section header */}
        <div data-anime className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            What I Offer
          </span>
          <h2 id="services-heading" className="section-title">
            Services
          </h2>
          <p className="section-subtitle mx-auto">
            Focused freelance engagements across three disciplines — shipped to production,
            not just delivered as a handover document.
          </p>
        </div>

        {/* Service cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.id}
                data-anime
                className={`relative rounded-2xl border bg-card p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1.5 ${service.accent}`}
                style={{
                  boxShadow: "var(--shadow-md)",
                  borderColor: "oklch(var(--border))",
                }}
                aria-labelledby={`service-${service.id}-heading`}
              >
                {/* Icon + label */}
                <div className="flex items-start justify-between">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient}`}
                  >
                    <Icon className="w-7 h-7 text-foreground" aria-hidden="true" />
                  </div>
                  <span className="tech-badge text-xs">{service.label}</span>
                </div>

                {/* Title + description */}
                <div>
                  <h3
                    id={`service-${service.id}-heading`}
                    className="text-xl font-bold text-foreground mb-3 tracking-tight"
                  >
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {service.description}
                  </p>
                </div>

                {/* Capabilities list */}
                <ul className="space-y-2 flex-1">
                  {service.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {cap}
                    </li>
                  ))}
                </ul>

                {/* Tech stack chips */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  {service.stack.map((tech) => (
                    <span key={tech} className="tech-badge text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA strip */}
        <div data-anime className="mt-14 text-center">
          <p className="text-muted-foreground mb-6 text-sm">
            Need something that spans two or all three disciplines?{" "}
            <span className="text-foreground font-medium">Let&apos;s scope it together.</span>
          </p>
          <a
            href="#contact"
            className="btn-hero-secondary inline-flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get in touch
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Bottom divider */}
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(var(--primary) / 0.15), transparent)",
        }}
      />
    </section>
  );
}
