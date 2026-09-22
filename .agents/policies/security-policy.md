# Security Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/documentation-policy.md`

## Apply When
- Auth, admin, session, payment, or other privileged-path changes

## Antigravity Execution Constraints
- Use `grep_search` and code analysis tools to thoroughly validate trust boundaries, authority transitions, signer assumptions, replay protection, and privileged-path authorization.
- Server routes and server actions must validate session, CSRF tokens, and permission grants before mutating state.
- Frontend and auth code cannot make client-side authority decisions or allow unverified state transitions.
- Blocking findings must be fixed before completion; waivers belong in canonical PR or RFC records, not in agent prompts.
- Keep threat-model and mitigation docs aligned through `docs-policy` when the risk surface changes.
- **Delegation**: If complex security verification is needed, use `invoke_subagent` to spawn a dedicated `security` expert to audit your code in parallel.
- **Mandatory In-Code Security Commentary**: Every critical security check, authority verification, signature validation, rate limit, anti-bot guard, and server-side mutation MUST include an inline explanatory comment specifying the defended invariant, threat mitigation rationale, and failure mode.

## Required Evidence
- Security findings and mitigations listed in the conversation or `walkthrough.md`
- In-code security invariant commentary verified across privileged routes and server actions
- Test or browser proof for each resolved high-risk path
- Updated docs paths using `write_to_file` when the trust model changed
