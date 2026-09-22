---
type: ADR
title: Authentication Flow Specification
description: Client and server authentication flow — session verification, CSRF token validation, and role-based access.
tags: [auth, session, security, nextjs]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Authentication Flow Specification

## Scope
- User authentication, CSRF challenge validation, session token issuance, and server session verification.

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Client as Next.js Client
  participant Server as Next.js Server / API

  User ->> Client: Enter Credentials / Authenticate
  Client ->> Server: Request Auth Challenge / CSRF Token
  Server -->> Client: Return CSRF Token
  Client ->> Server: Submit Auth Payload + CSRF Token
  Server ->> Server: Validate Credentials & Session Invariants
  Server -->> Client: Issue HttpOnly Session Cookie / Token
```

## Security Invariants
- Session tokens must be HttpOnly, Secure, and SameSite=Lax/Strict.
- CSRF tokens must be validated with zero replay allowance on state-mutating requests.

Last Updated: 2026-09-21 04:26:52 UTC
