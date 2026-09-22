---
type: ADR
title: State Machine Architecture
description: Formal state machine definitions, lifecycle states, allowed transitions, illegal transitions, and determinism constraints.
tags: [architecture, state-machine, workflow, lifecycle]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# State Machine Architecture

## Scope
- Domain entity / pipeline lifecycle states and transition invariants.

## States
| State | Description | Entry Condition | Exit Condition |
| --- | --- | --- | --- |
| `idle` | Initialized, waiting for user trigger | Component mounted / initialized | User initiates action |
| `preparing` | Assembling parameters and request payload | User trigger received | Payload prepared |
| `validating` | Validating payload against schema (Zod) | Payload prepared | Schema validation succeeds |
| `submitting` | Dispatching request to Server Action / API Route | Validation passed | API response returned |
| `completed` | Terminal success state | Response status == 200/201 | Terminal |
| `failed` | Terminal failure state | Error encountered / request rejected | Terminal |

## Allowed Transitions
| From | Action | To | Validation |
| --- | --- | --- | --- |
| `idle` | `prepare` | `preparing` | Valid request parameters |
| `preparing` | `validate` | `validating` | Schema validation passed |
| `validating` | `submit` | `submitting` | Valid input schema |
| `submitting` | `finalize` | `completed` | API success status |
| `*` | `catchError` | `failed` | Error caught at any stage |

## Illegal Transitions
- [x] Transition: `completed -> preparing`
  - Reason blocked: Completed operations are terminal.
  - Expected error: `InvalidTransitionError: Terminal state cannot be re-executed.`
- [x] Transition: `failed -> submitting`
  - Reason blocked: Failed workflows must re-enter from `idle` or `preparing`.
  - Expected error: `InvalidTransitionError: Direct submission from failed state is prohibited.`

## State Diagram

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> preparing: prepare()
  preparing --> validating: validate()
  validating --> submitting: submit()
  submitting --> completed: success
  validating --> failed: validation error
  submitting --> failed: server / network error
  completed --> [*]
  failed --> [*]
```

## Determinism & Invariants
- No floating-point arithmetic used for accounting or balance math.
- State transitions are deterministic and pure.
