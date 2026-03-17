# Execution Scripts (Layer 3)

Deterministic Python/Bash scripts that handle the actual work. These are called by the
orchestration layer (AI agent) based on directives from Layer 1.

## Conventions

- Scripts must be idempotent where possible
- Environment variables and API tokens are stored in `.env`
- Each script handles one concern (single responsibility)
- Well-commented with clear input/output contracts
- Exit codes: 0 = success, non-zero = failure with descriptive stderr

## Naming Convention

```
execution/
├── {action}_{target}.py      # e.g. scrape_single_site.py, generate_report.py
├── {action}_{target}.sh      # e.g. deploy_k8s.sh, backup_database.sh
└── README.md
```
