import { useRef } from "react";
import { Server, GitBranch, BarChart3, Clock, ExternalLink, Construction } from "lucide-react";

import { revealOnScroll, useAnime } from "@/lib/use-anime";

type CaseStudyStatus = "live" | "in-progress" | "planned";

interface Metric {
  label: string;
  value: string;
}

interface CaseStudy {
  id: string;
  status: CaseStudyStatus;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  stack: string[];
  metrics: Metric[];
  /** GitHub repo URL — shown when status is live */
  repoUrl?: string;
  /** Case study document URL — shown when status is live */
  caseStudyUrl?: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: "k8s-ref",
    status: "in-progress",
    label: "Infrastructure",
    title: "K8s Reference Architecture",
    subtitle: "Production-grade Kubernetes on bare metal",
    description:
      "A self-hosted, single-node MicroK8s cluster that mirrors the architecture of a production platform — ArgoCD App-of-Apps GitOps, External Secrets Operator, cert-manager, Prometheus/Grafana stack, and Cloudflare Tunnel exposure. Built to demonstrate that homelab ≠ toy.",
    icon: Server,
    stack: [
      "MicroK8s",
      "ArgoCD",
      "Helm",
      "Prometheus",
      "Grafana",
      "cert-manager",
      "ESO",
      "Cloudflare",
    ],
    metrics: [
      { label: "Setup to ArgoCD sync", value: "< 2h" },
      { label: "TLS provisioned via", value: "cert-manager" },
      { label: "Secret backend", value: "ESO + Vault" },
      { label: "Public endpoint", value: "Cloudflare Tunnel" },
    ],
    repoUrl: "https://github.com/maseko-lucky-9/k8s-ref",
  },
];

const statusConfig: Record<CaseStudyStatus, { label: string; colour: string }> = {
  live: { label: "Live", colour: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  "in-progress": {
    label: "In Progress",
    colour: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  planned: { label: "Planned", colour: "text-muted-foreground bg-muted/60 border-border" },
};

export function CaseStudiesSection() {
  const rootRef = useRef<HTMLElement>(null);

  useAnime(
    rootRef,
    (scope) => {
      const root = rootRef.current;
      if (!root) return;
      if (scope.matches.reducedMotion) return;
      return revealOnScroll(root, "[data-anime]", { staggerMs: 100 });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      id="case-studies"
      aria-labelledby="case-studies-heading"
      className="py-20 md:py-28"
    >
      <div className="section-container !py-0 py-20 md:py-28">
        {/* Section header */}
        <div data-anime className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Real Projects
          </span>
          <h2 id="case-studies-heading" className="section-title">
            Case Studies
          </h2>
          <p className="section-subtitle mx-auto">
            Architecture decisions, trade-off analysis, and measured outcomes — not just a list of
            technologies used.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {caseStudies.map((cs) => {
            const Icon = cs.icon;
            const { label: statusLabel, colour: statusColour } = statusConfig[cs.status];

            return (
              <article
                key={cs.id}
                data-anime
                aria-labelledby={`cs-${cs.id}-heading`}
                className="rounded-2xl border bg-card overflow-hidden"
                style={{
                  boxShadow: "var(--shadow-md)",
                  borderColor: "oklch(var(--border))",
                }}
              >
                <div className="p-8">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 shrink-0">
                        <Icon className="w-6 h-6 text-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                          {cs.label}
                        </span>
                        <h3
                          id={`cs-${cs.id}-heading`}
                          className="text-xl font-bold text-foreground mt-0.5 tracking-tight"
                        >
                          {cs.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{cs.subtitle}</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusColour}`}
                    >
                      {cs.status === "in-progress" && (
                        <Construction className="w-3 h-3" aria-hidden="true" />
                      )}
                      {cs.status === "live" && <GitBranch className="w-3 h-3" aria-hidden="true" />}
                      {cs.status === "planned" && <Clock className="w-3 h-3" aria-hidden="true" />}
                      {statusLabel}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-6">{cs.description}</p>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-muted/40 border border-border/60">
                    {cs.metrics.map((m) => (
                      <div key={m.label} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <BarChart3 className="w-3 h-3" aria-hidden="true" />
                          <span className="text-[10px] uppercase tracking-wider font-medium">
                            {m.label}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cs.stack.map((tech) => (
                      <span key={tech} className="tech-badge text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {cs.repoUrl && (
                      <a
                        href={cs.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
                        aria-label={`View ${cs.title} on GitHub`}
                      >
                        <GitBranch className="w-4 h-4" aria-hidden="true" />
                        GitHub repo
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                    {cs.caseStudyUrl ? (
                      <a
                        href={cs.caseStudyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
                        aria-label={`Read ${cs.title} case study`}
                      >
                        Read case study
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : cs.status === "in-progress" ? (
                      <span className="text-xs text-muted-foreground italic">
                        Full write-up publishing after cluster goes live
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty state hint — visible when no items */}
        {caseStudies.length === 0 && (
          <div className="text-center py-20 text-muted-foreground animate-in fade-in duration-500">
            <Construction className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Case studies in progress</p>
            <p className="text-sm mt-2">Check back once the first project ships.</p>
          </div>
        )}
      </div>
    </section>
  );
}
