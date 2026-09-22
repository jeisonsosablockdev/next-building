---
type: Policy
title: Security Quality Policy
description: Security Quality Policy - migrated from knowledge/
tags: [governance]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/next-building/blob/develop/knowledge/governance/security-quality-policy.md
---

🔴 SECURITY + QUALITY POLICY

⸻

🔴 SECURITY PACK (MANDATORY BEFORE DEPLOY)

Run ALL:
	•	security-audit
	•	security-auditor
	•	threat-modeling-expert
	•	threat-mitigation-mapping
	•	security-scanning-security-sast
	•	security-scanning-security-hardening
	•	security-scanning-security-dependencies
	•	top-web-vulnerabilities
	•	production-code-audit

⸻

🧪 STORY & SPEC LEVEL TDD & REFACTOR GATES (MANDATORY)

For every SPEC:
	•	**Phase 1 (RED)**: Start with comprehensive failing unit/integration tests using the `tdd-primal` skill before touching production implementation.
	•	**Phase 2 (GREEN)**: Assigned specialist subagent implements production code with mandatory in-code commentary until all tests pass.
	•	**Phase 3 (REFACTOR)**: Execute a clean-code refactoring pass using the `code-refactoring-refactor-clean` skill to eliminate debt, maintain single responsibility, and ensure zero dead code.
	•	Run full quality gate (`pnpm validate`) before Gate 2 review and human acceptance.

If tests are missing or failing → SPEC is incomplete.

⸻

🗃 DATABASE SCHEMA CHANGE GATE (MANDATORY)

Applies when changes affect:
	•	`/db/migrations`
	•	`/lib/db`
	•	DB-backed repositories, persistence adapters, or SQL assumptions

Rules:
	•	Tracked SQL migrations must exist before DB-backed schema changes are considered complete.
	•	Local development must not depend on remembering manual migration runs; the canonical dev flow must apply tracked migrations automatically when `DATABASE_URL` is configured.
	•	`npm run validate` must include DB migration validation.
	•	PR CI must exercise migration application against a clean Postgres instance.
	•	If tracked migrations are pending on the target database, task completion is blocked until `npm run db:migrate` is applied successfully.

⸻

🏁 PRODUCTION RELEASE CHECKLIST
	•	Full test suite passes cleanly (`pnpm test`).
	•	Full repo type-check and lint pass cleanly (`pnpm type-check`, `pnpm lint`).
	•	Next.js application builds without errors or warnings (`pnpm build`).
	•	All DB migrations applied and validated (`pnpm validate:db`).
	•	All frontend auth verified server-side with CSRF / anti-replay protections.
	•	Zero secret keys or private credentials exposed to client bundles.
	•	Replay protection validated.
	•	Clean code standards enforced.
	•	No warnings in build output.
	•	Dependencies audited.

⸻

🔐 APPLICATION SECURITY RULES

If change affects /app or /apps/web:
	•	Server-side session verification mandatory
	•	CSRF and replay protection validated
	•	No client authority trust
	•	Validate input payloads using Zod or Valibot schemas before processing

⸻

🧬 DEVELOPMENT PHILOSOPHY
	•	Clean Code always: Mandatory in-code commentary, layer header annotations, and step-by-step logic indicators.
	•	Security before features: All security invariants, session checks, and authority guards must be documented inline.
	•	Deterministic state transitions.
	•	Minimal trust surface.
	•	Explicit authority validation.
	•	Refactor continuously.
