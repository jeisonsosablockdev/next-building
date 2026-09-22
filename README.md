# Next.js Monorepo Starter

High-performance Next.js 16 monorepo starter with 4-Layer Functional Architecture and Autonomous Agent Governance Harness.

<!-- DOCS-AUTO:START -->
## Documentation Snapshot (Auto-generated)

Updated: 2026-09-21 10:56:19 UTC

| Document | Scope | Last Updated | Last Commit |
| --- | --- | --- | --- |
| [`architecture-overview.md`](./knowledge/architecture/architecture-overview.md) | architecture | not set | 2026-08-23 a69db56b |
| [`auth-flow.md`](./knowledge/architecture/auth-flow.md) | frontend/auth | 2026-09-21 04:26:52 UTC | 2026-08-23 a69db56b |
| [`authority-model.md`](./knowledge/architecture/authority-model.md) | architecture | not set | 2026-08-23 a69db56b |
| [`index.md`](./knowledge/architecture/index.md) | general | not set | 2026-08-23 a69db56b |
| [`session-model.md`](./knowledge/architecture/session-model.md) | frontend/auth | 2026-09-21 04:26:52 UTC | 2026-08-23 a69db56b |
| [`state-machine.md`](./knowledge/architecture/state-machine.md) | architecture | not set | 2026-08-23 a69db56b |
| [`threat-model.md`](./knowledge/architecture/threat-model.md) | architecture | not set | 2026-08-23 a69db56b |
| [`toolchain-policy.md`](./knowledge/architecture/toolchain-policy.md) | general | not set | 2026-08-23 a69db56b |

### Required Docs by Change Type
- Frontend/Auth (/app): `knowledge/architecture/auth-flow.md`, `knowledge/architecture/session-model.md`
- Architecture & Governance: `knowledge/architecture/architecture-overview.md`
<!-- DOCS-AUTO:END -->

## Operational Architecture

This repository is structured as a high-performance **pnpm monorepo** for **Next.js**:

- `apps/web/`: Next.js 16 (App Router) presentation application with Tailwind CSS, React 19, Motion, and 4-layer functional architecture.
- `knowledge/`: Canonical OKF documentation, governance policies (`knowledge/governance/`), and architecture specifications.
- `scripts/`: Task lifecycle automation (`task-init.sh`), 4-layer architecture linter, and CI governance scripts.
- `tests/`: Integration tests, unit tests, and autonomous agent governance harness (`tests/harness/`).
- `.agents/`: Autonomous agent definitions, policies, workflows, and task state tracking.

---

## 4-Layer Functional Architecture

All frontend and client code in `apps/web/src/` adheres strictly to 4 decoupled layers:

1. **Layer 1: Presentation** (`apps/web/src/app`, `apps/web/src/components`):
   - UI views, layout skeletons, interactive components, client boundaries.
2. **Layer 2: Application / Consumption** (`apps/web/src/lib/hooks`, `apps/web/src/lib/state`):
   - React custom hooks, client state management, application store mutations.
3. **Layer 3: Domain / Pipelines** (`apps/web/src/lib/pipelines`):
   - Pure domain business logic, input validation pipelines, execution workflows.
4. **Layer 4: Infrastructure** (`apps/web/src/lib/infrastructure`, `apps/web/src/lib/utils.ts`):
   - API clients, environment resolution, HTTP transports, and shared utilities.

---

## Getting Started & First-Time Setup

When cloning this repository for the first time, run the interactive setup wizard:

```bash
pnpm setup
```

The wizard will configure:
1. **Developer Handle**: Sets your username in `.agents/hooks.json` to enforce branch and task ownership.
2. **Project Name**: Updates root `package.json` and `apps/web/package.json` with your project's slug.
3. **Linear Integration (Optional)**: Connect your Linear organization with API key and issue prefix, or skip for seamless standalone/local task workflows.

---

## Development Commands

```bash
# Start Next.js development server
pnpm dev

# Run unit and starter tests
pnpm test

# Run governance & harness verification suite
pnpm test:harness

# Execute complete CI validation (Lint, Typecheck, Licenses, 4-Layer Architecture, Harness)
pnpm validate

# Build Next.js for production
pnpm build
```

---

## Agent Governance & Task Lifecycle

This repository uses the Autonomous Agent Governance framework. All changes follow the 8-phase task lifecycle with double-gatekeeper enforcement:

1. **Task Initialization**:
   ```bash
   pnpm task:init
   ```
2. **Architecture Review (Gate 1)**: Pre-implementation Solution Spec review.
3. **TDD RED Phase**: Write tests before production implementation.
4. **Code Implementation**: Write clean production code with mandatory in-code commentary.
5. **Diff Audit (Gate 2)**: Architecture isolation audit & `pnpm validate`.
