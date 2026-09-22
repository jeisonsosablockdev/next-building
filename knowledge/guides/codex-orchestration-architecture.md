---
type: Guide
title: Codex Orchestration Architecture
description: Codex Orchestration Architecture - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/next-building/blob/develop/knowledge/guides/codex-orchestration-architecture.md
---

# Codex Orchestration Architecture

## Goal

- Replace the monolithic `AGENTS.md` playbook with a layered Codex-first architecture.
- Keep `knowledge/governance/*` and executable CI scripts as the canonical source of truth.
- Reduce context pollution, prompt collisions, and repeated governance text.
- Improve deterministic workflow activation and future parallel delegation.

## Target Layout

```text
AGENTS.md
.agents/
  agents/
    planner.yaml
    architect.yaml
    frontend.yaml
    api.yaml
    db.yaml
    state.yaml
    reviewer.yaml
    qa.yaml
    docs.yaml
    security.yaml
  workflows/
    frontend-cycle.md
    refactor-cycle.md
    responsive-qa.md
    spec-execution-cycle.md
  policies/
    frontend-policy.md
    security-policy.md
    docs-policy.md
    testing-policy.md
knowledge/
  governance/
```

## Responsibility Split

| Layer | Owns | Must Not Own |
| --- | --- | --- |
| `AGENTS.md` | Entry routing, workflow activation map, delegation rules, DoD summary, canonical references | Detailed governance, long workflows, specialist domain prompts |
| `.agents/agents/*.yaml` | Narrow specialist prompts, model preference, scope, read set, delegation surface | Cross-cutting process definitions, duplicated hard rules |
| `.agents/workflows/*.md` | Execution order, gates, required evidence, handoffs | Specialist implementation detail, long policy prose |
| `.agents/policies/*.md` | Reusable hard constraints summarized from canonical docs | Full governance duplication, workflow sequencing |
| `knowledge/governance/*` | Canonical repository policy | Agent-specific prompting or orchestration detail |

## Migration Rationale

- The old `AGENTS.md` mixed routing, governance, workflow steps, tool guidance, and domain detail into one prompt surface.
- That design made every task pay the cost of loading rules that only matter for a subset of changes.
- The new structure keeps the entrypoint short, then loads only the workflow and policy files relevant to the touched scope.
- Specialist agents now get narrow prompts and explicit read sets, which lowers token overhead and reduces instruction collisions.
- Reviewer, QA, docs, and security become reusable sidecars that can join multiple workflows without re-encoding the same rules in each domain prompt.
- CI, RFC, PR, docs, Playwright, and responsive enforcement stay in their existing canonical docs and scripts; this refactor changes orchestration, not governance authority.

## Orchestration Flow

1. `planner` reads `AGENTS.md`, the touched paths, and only the workflow and policy files that match the task.
   - If the brief is vague, the bootstrap flow should run a Socratic clarification pass with `explain-like-socrates` before choosing the branch shape so the task expands into a concrete problem, outcome, scope, and branch plan.
2. `planner` activates one or more workflows based on scope: frontend, refactor, responsive QA, spec execution.
3. For multi-SPEC work, `planner` and `docs` require the spec/documentation slice to use `explain-like-socrates` before finalizing artifacts and to define a clean-code design contract for each delivery slice before implementation opens. Each delivery slice must have a clean-code design contract for each delivery slice before implementation opens.
4. `planner` delegates the smallest useful context to specialists, including changed paths, active workflow, required policies, evidence expectations, clean-code design contract, and open risks.
5. Domain specialists implement or analyze within their lane:
   - `frontend` for App Router, client components, and UI boundaries
   - `api` for route handlers, webhooks, and third-party integrations
   - `db` for database schemas, migrations, and repositories
   - `state` for client/global state stores
6. Cross-cutting specialists join as needed:
   - `security` for trust-boundary review
   - `docs` for canonical doc sync and traceability
   - `qa` for tests, E2E, responsive checks, and browser evidence
7. `reviewer` runs as the final gate for clean code, governance alignment, duplication, naming, and missing evidence.
8. `planner` aggregates the results and blocks completion unless every active workflow gate and DoD item is green.
9. For final work targeting `develop`, `planner` stops before merge and waits for explicit user manual-test approval recorded as Human Acceptance.

## Recommended Routing Examples

| Change Shape | Workflow Activation | Primary Agents | Sidecar Agents |
| --- | --- | --- | --- |
| `app/**` UI or layout component | `frontend-cycle` + `responsive-qa` | `frontend` | `qa`, `docs`, `reviewer` |
| `app/api/**` REST/Route handlers | `spec-execution-cycle` | `api` | `security`, `docs`, `qa`, `reviewer` |
| `db/**` schema or database repository | `spec-execution-cycle` | `db` | `security`, `docs`, `qa`, `reviewer` |
| Client/Server state management | `spec-execution-cycle` | `state`, `frontend` | `qa`, `reviewer` |
| RFC or governance-only update | No product workflow unless enforcement changes | `docs` | `reviewer` |

## Validation Checklist

- `AGENTS.md` routes only and points to canonical governance.
- Workflows define process, gates, evidence, and handoffs only.
- Agents define expertise, scope, and context boundaries only.
- Policies define reusable constraints only.
- Canonical governance remains in `knowledge/governance/*` and executable scripts.
- The architecture is safe for parallel specialist delegation because write ownership is explicit and cross-cutting reviewers are reusable.
