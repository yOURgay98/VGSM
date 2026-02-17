# VSM Security Guide

This document summarizes the production threat model and hardening posture for **Vanguard Security & Management (VSM)**.

## Threat model (practical)

VSM assumes attackers may attempt:

- Credential stuffing and brute-force sign-in attempts
- Invite/access-key brute force or replay
- Unauthorized cross-tenant access
- Privilege escalation via client-side tampering
- Abuse of high-risk moderation/command actions
- Session theft and stale-session abuse

## Security controls in place

### Authentication and sessions

- Database-backed sessions (server authoritative)
- Sign-in rate limiting and lockouts
- Optional/required TOTP 2FA for privileged staff
- Session revoke endpoints and explicit sign-out clearing

### Authorization and tenant isolation

- Server-side permission checks (RBAC)
- Tenant membership required for protected actions
- Community-scoped reads/writes to prevent data leakage

### Abuse protection

- Rate limits for:
  - login attempts
  - invite/access-key redemption
  - bot/sensitive endpoints
- Friendly `429` responses for user-facing flows

### Audit and forensics

- Audit events for auth events, key creation/redemption, role/approval actions
- Tamper-evident audit hash chain
- Security event feeds for suspicious behavior

### Data and secret handling

- Password hashing at rest
- Encryption key for sensitive secrets (`AUTH_ENCRYPTION_KEY`)
- No plaintext secrets in source control
- Production startup guards for missing critical env vars

### Browser and transport hardening

- Security headers (CSP, HSTS in production, referrer policy, content-type protections)
- HTTPS required in production

## Operational best practices

1. Enforce 2FA for OWNER/ADMIN.
2. Use least-privilege role assignments.
3. Rotate secrets and API keys regularly.
4. Monitor lockouts and unusual key redemption activity.
5. Backup database and test restore procedures.
6. Keep dependencies patched.

## Incident response basics

If compromise is suspected:

1. Revoke active sessions for impacted users.
2. Rotate `NEXTAUTH_SECRET`, encryption keys, and integration tokens.
3. Disable suspicious accounts.
4. Review audit/security events for scope.
5. Restore known-good state if required.
