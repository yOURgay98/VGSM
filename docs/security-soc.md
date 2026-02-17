# Security Operations Center (SOC)

ESS includes a Security Operations Center page at:

- `/app/security`

It provides a signal-oriented view of authentication, approvals, and suspicious activity.

## SecurityEvent Model

Signals are stored in `SecurityEvent`:

- `communityId` is nullable to support global user-scoped events (rare)
- `userId` is nullable for system-wide signals
- `severity`: `LOW | MEDIUM | HIGH | CRITICAL`
- `eventType`: stable string identifiers
- `metadata`: JSON payload for debugging/context

SecurityEvents are **in addition** to the append-only `AuditLog` hash chain. Audit is the source of truth; SecurityEvents are the alerting layer.

## Event Sources

The app generates SecurityEvents server-side for:

- `login_failed_burst`
  - > = 5 failed sign-in attempts within the lockout window
- `login_new_ip`
  - successful login from an IP not seen for that user in the last 30 days
- `invite_redeem_burst`
  - > = 5 invite redeems from the same IP within 30 minutes
- `high_risk_command_burst`
  - > = 3 HIGH risk command executions by the same user within 10 minutes
- `approval_spam`
  - > = 5 approval requests by the same user within 10 minutes
- `cross_tenant_access_attempt` (CRITICAL)
  - detected by tenant enforcement when an actor attempts to access a resource belonging to another community

## SOC Dashboard Metrics

The SOC dashboard shows:

- Active sessions (last 5 minutes)
- Failed logins (last 24 hours)
- 2FA enrollment % among staff memberships
- High-risk commands (last 7 days)
- Locked accounts (current)
- Suspicious sessions (new IP events, last 7 days)
- Security event feed with filters

Metrics are cached in-memory per community for ~10 seconds to reduce dashboard load.

## Auto-Freeze (Optional)

Community security settings can enable auto-freeze:

- Default: disabled
- Default threshold: `CRITICAL`

When enabled and the threshold is met, ESS can disable accounts (`User.disabledAt`) and revoke sessions.

Safety:

- Owners are never auto-frozen; human decision required.
