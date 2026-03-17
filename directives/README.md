# Directives (Layer 1)

Standard Operating Procedures written in Markdown. Each directive defines:

- **Goal** — what outcome is expected
- **Inputs** — what data/context is needed
- **Tools/Scripts** — which execution scripts to call (from `execution/`)
- **Outputs** — what artifacts are produced
- **Edge Cases** — known failure modes and handling

Directives are natural language instructions, like you'd give a mid-level employee.
The orchestration layer (AI agent) reads these and routes to the appropriate execution scripts.

## Naming Convention

```
directives/
├── {domain}_{action}.md      # e.g. deploy_frontend.md, scrape_website.md
└── README.md
```
