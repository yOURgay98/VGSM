# Decisions

This document tracks non-trivial implementation decisions made while evolving ESS.

## 2026-02-15: Tenant Violation Logging Strategy

- We treat "cross-tenant attempt" as: the requested resource exists, but belongs to a different `communityId` than the actor's active community.
- On a cross-tenant attempt we:
  - Return `404` in page routes (via `notFound()`).
  - Throw a generic "not found" / "cannot proceed" error in server actions/services (no resource existence leakage).
  - Write an audit event `tenant.violation` with metadata: `operation`, `resource`, `resourceId`, `resourceCommunityId`.
- We only perform the "does this id exist elsewhere?" lookup on failure paths (resource not found in the active community) to avoid adding a query to normal traffic.

## 2026-02-15: Membership Creation Rules (Multi-Tenant Safety)

- We do not auto-create community memberships on community switch or on ordinary page loads.
- Memberships are created only through explicit join flows (invite redeem) or explicit admin flows (future: community creation UI).
- If a user has zero memberships, the app redirects them to `/onboarding` to join a community via invite.

## 2026-02-15: Invite Approval Uses The Existing ApprovalRequest Workflow

- Invite templates/invites can require approval before granting community membership.
- We reuse `ApprovalRequest` for this, storing `payloadJson.kind = "invite.join"`.
- Approval execution is handled inside `executeCommandFromApproval()` (it now dispatches non-command approvals before command execution).

## 2026-02-15: Password Login With Auth.js Database Sessions

- Auth.js/NextAuth v5 credentials sign-in is not compatible with `session.strategy = "database"` (it requires JWT strategy).
- ESS requires database sessions (session management, presence, active community tracking), so we keep DB sessions and implement a dedicated password login endpoint:
  - `POST /api/auth/credentials` verifies email/password (+ TOTP/backup code when enabled), then creates a `Session` row and sets the `authjs.session-token` cookie.
- The UI login form calls this endpoint directly instead of `signIn("credentials")`.

## 2026-02-15: Discord OAuth Is Link-Only By Default

- Discord OAuth is used to link a Discord identity to an existing ESS account.
- We prevent using Discord OAuth as a primary sign-in method by requiring an existing session for:
  - `/api/auth/signin/discord`
  - `/api/auth/callback/discord`
- This is enforced in `proxy.ts` (we avoid Next middleware conflicts).

## 2026-02-15: Tactical Map Style URL Guardrails

- MapLibre style URL is configurable per community via `Setting.key = "map"`.
- Allowed `styleUrl` values:
  - local paths starting with `/`
  - `https://...` remote styles
  - `http://...` only when `NODE_ENV !== "production"`
- This reduces the risk of unsafe schemes and keeps defaults predictable.

## 2026-02-15: Cursor Pagination Defaults

- All large list views use cursor pagination (take+1 strategy).
- Cursors are stable and scoped to the active community.
- For Audit logs, cursor is `chainIndex` (monotonic), not the random `id`.

## 2026-02-15: AUTH_BYPASS Skips 2FA Gate In Dev Only

- In local development, `AUTH_BYPASS=true` is used to skip sign-in for UI/dev work.
- To prevent the app from immediately redirecting to 2FA enrollment, we skip the 2FA enforcement redirect when bypass is enabled.
- Bypass (and therefore this skip) is hard-disabled when `NODE_ENV=production`.

## 2026-02-15: Secure Bootstrap OWNER (No Hardcoded Credentials)

- ESS does not ship with hardcoded OWNER credentials.
- If the database has no `Role.OWNER` user, the first password login attempt will bootstrap:
  - a default community (`community_default`)
  - system roles + permissions
  - an OWNER user from `OWNER_EMAIL`
- Password selection:
  - Prefer `OWNER_BOOTSTRAP_PASSWORD` when set.
  - Otherwise generate a one-time password and print it to the server console.
- Bootstrapped owners are forced through a password-change gate (`User.forceChangePassword=true`).

## 2026-02-15: Safer Seed Defaults

- `prisma db seed` no longer creates predictable credentials.
- Destructive reset and demo data are opt-in:
  - `SEED_RESET_DB=true`
  - `SEED_DEMO_DATA=true`

## 2026-02-16: Bootstrap OWNER Defaults + Production Guardrails

- Default `OWNER_EMAIL` is `mangukonto58@gmail.com` when the environment variable is missing or invalid.
- In production, `OWNER_BOOTSTRAP_PASSWORD` is required. If it is missing, bootstrap will refuse to run (fail closed).
- In development, if `OWNER_BOOTSTRAP_PASSWORD` is missing, a one-time password is generated and printed to the server console.

## 2026-02-16: Invite Tokens Are Hash-Only

- Invites store only a `tokenHash` (SHA-256) and a non-redeemable `tokenPreview` for operator reference.
- The raw invite token is shown only once at creation.
- This prevents database leaks from immediately exposing redeemable invite links.

## 2026-02-16: Reference Map + Operational Overlay Strategy

- Directly drawing operational layers on top of a third-party cross-origin iframe (`https://erlc-hub.pages.dev`) is not feasible due browser security isolation.
- We keep the reference map as the visual base and render an embedded operational overlay map dock in the same frame.
- The dock stays live for calls/units/POIs/zones and selection workflows, while preserving the third-party reference context.

## 2026-02-16: One-Click Desktop Download Endpoint

- Canonical endpoint: `GET /api/download/latest?platform=win|mac|linux`.
- If a matching binary exists, it returns `302` to `/downloads/<file>`.
- If missing, it returns a typed JSON error `{ code: "not_available" }`.
- Landing/download UI call this endpoint first and render a polished fallback instead of raw errors.

## 2026-02-16: Preserve Active Selection During Toolbar Search Sync

- Toolbar query synchronization on Players/Dispatch now compares the pending query with current URL query before writing.
- If query text is unchanged, URL is not rewritten and selected row params (`playerId`, `callId`) remain stable.
- This prevents inspector panels from instantly closing after a selection click.

## 2026-02-16: Public Sign-In Route Alias

- Marketing entrypoint now uses `/auth/sign-in` for clarity.
- `/auth/sign-in` is implemented as a simple alias redirect to `/login` so existing auth flow remains unchanged.

## 2026-02-16: Reference Map Overlay Toolkit Behavior

- Reference map runs in a cross-origin iframe, so true coordinate-layer drawing is not possible inside the third-party map.
- VSM uses a shared overlay toolkit and screen-space pins for reference mode while preserving full coordinate-accurate tooling on operational MapLibre.
- Split mode pairs operational + reference maps side-by-side to keep both context and actionable coordinate workflows.

## 2026-02-16: Dispatch Map Event Bridge

- Call-location picking and map pings use client events:
  - `vsm:map-toolkit:start-call-picker`
  - `vsm:map-toolkit:call-location-picked`
  - `vsm:map-toolkit:ping-coordinate`
- This keeps create-call modal and inspector location actions synchronized with the live operational map without introducing new backend complexity.

## 2026-02-16: Static Image Tactical Map Replaces Reference/Split Modes

- Dispatch now uses a single static-image tactical map (`/public/maps/erlc-map.png`) with pan/zoom transforms and SVG overlays.
- Reference iframe and split-map mode were removed to avoid cross-origin overlay complexity and provide one consistent operational flow.
- If the image file is missing:
  - dev: show explicit install path guidance
  - production: show a friendly unavailable card

## 2026-02-16: Normalized Map Coordinates

- New operational map coordinates are normalized (`0..1`) as `mapX/mapY`.
- `DispatchCall` and `MapPOI` now store `mapX/mapY` while retaining legacy `lat/lng` for backward compatibility.
- New call/POI placement workflows use `mapX/mapY` as the source of truth.
- Legacy POIs/zones without normalized coordinates are surfaced as "unmapped" so operators can reposition them.

## 2026-02-17: Welcome Invite Intro Removed

- Removed the `/welcome/*` invite-intro routes and related onboarding overlay.
- Invites now flow directly through `/invite/[token]` + normal in-app onboarding.
- Rationale: reduce complexity and keep the beta join flow straightforward during launch.

## 2026-02-16: Static Map Ping Reliability Guardrail

- Static map drag state now only starts in `tool = none` mode.
- Pointer-up clears drag state, preventing stale drag flags from suppressing click-based tools (ping/add POI/call picker/zone draw).
- This change prioritizes deterministic tool clicks over drag interactions while editing.

## 2026-02-16: Auth Bypass Requires Explicit Unsafe Opt-In

- `AUTH_BYPASS` alone is no longer enough to bypass authentication in development.
- Bypass now requires both:
  - `AUTH_BYPASS=true`
  - `AUTH_BYPASS_UNSAFE=true`
- This prevents accidental auth bypass in local environments where `.env` was left in bypass mode.

## 2026-02-16: Safe Auth Redirect Defaults

- Added a shared `safeInternalRedirect()` helper for auth callback handling.
- Sign-out now redirects to `/` as the universal safe landing route instead of relying on route aliases.
- Auth callbacks that are non-internal or malformed always fall back to a known internal page.

## 2026-02-16: Moderation Desk Macros (Community Scoped)

- Added `ModerationMacro` as a lightweight, tenant-scoped helper for consistent moderation notes/reasons.
- Macro management is restricted to `settings:edit` and all macro mutations are audited.
- Moderation Desk actions (`assign_to_me`, `in_review`, `resolve`) route through existing permission-checked services and write audit trails.

## 2026-02-16: Final Ship Hardening (Auth + Deploy Guards)

- Landing now keeps a single primary auth CTA in the header (`Sign in` or `Open Dashboard` based on session state).
- Auth environment validation is strict at runtime and production-safe, but production **build phase** is warning-only for missing owner/bootstrap vars and bypass flags to avoid blocking local release builds.
- Stale or invalid auth cookies during page renders now trigger a safe redirect to `/api/auth/clear-session` (then `/`) instead of throwing an uncaught "Authentication required" error in secure pages.
- Sign-out flow is normalized through `/api/auth/clear-session` to avoid route mismatch/404 regressions and ensure DB session revocation + audit logging.
