# ERLC Moderation Panel

Production-oriented moderation dashboard for ERLC roleplay communities.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS + shadcn/ui-style components + lucide-react
- Framer Motion (subtle UX animations)
- PostgreSQL + Prisma ORM
- NextAuth (Credentials + optional Discord OAuth)
- zod validation
- Vitest unit tests for auth/security utilities

## Features

- Invite-only auth with database-backed sessions (NextAuth) and role-based access (`OWNER`, `ADMIN`, `MOD`, `TRIAL_MOD`, `VIEWER`)
- Neutral macOS utility UI with 3-pane workflow (List + Inspector) on Players/Cases/Reports
- Global Cmd/Ctrl+K command bar: search + audited staff commands
- Commands framework with two-person approvals for high-risk commands (configurable)
- Reports/Cases/Actions/Players core moderation workflows + quick actions
- Inbox triage page (unassigned reports/cases + pending approvals)
- Real TOTP 2FA + backup codes + session management (profile)
- Audit log with tamper-evident hash chain + integrity status in viewer
- Saved Views (per user) for common filter setups
- Minimal analytics (staff activity + avg report resolution time)

## Route Map

- `/login`
- `/invite/[token]`
- `/app`
- `/app/dashboard`
- `/app/inbox`
- `/app/players`
- `/app/players/[id]`
- `/app/reports`
- `/app/cases`
- `/app/cases/[id]`
- `/app/cases/[id]/export`
- `/app/actions`
- `/app/commands`
- `/app/analytics`
- `/app/audit`
- `/app/settings`
- `/app/profile`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Set PostgreSQL connection in `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erlc_panel?schema=public"
AUTH_SECRET="replace-with-long-random-secret"
NEXTAUTH_SECRET="replace-with-long-random-secret"
AUTH_ENCRYPTION_KEY="replace-with-32-byte-base64-or-64-char-hex"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_BYPASS="false"
AUTH_BYPASS_ROLE="OWNER"
SECURITY_REQUIRE_2FA_DEFAULT="true"
SECURITY_TWO_PERSON_DEFAULT="true"
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

4. Generate Prisma client + run migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed demo data

```bash
npm run prisma:seed
```

6. Run locally

```bash
npm run dev
```

## Seeded Credentials

- Owner: `owner@example.com` / `ChangeMe123!`
- Admin: `admin@example.com` / `ChangeMe123!`
- Mod: `mod@example.com` / `ChangeMe123!`
- Trial Mod: `trialmod@example.com` / `ChangeMe123!`
- Viewer: `viewer@example.com` / `ChangeMe123!`

## Port Conflicts (EADDRINUSE)

If port `3000` is already in use, either stop the existing Node/Next process or run on a different port:

PowerShell:

```powershell
$env:PORT=3001
$env:NEXTAUTH_URL="http://localhost:3001"
$env:NEXT_PUBLIC_APP_URL="http://localhost:3001"
npm run dev
```

## Temporary Auth Bypass

- Set `AUTH_BYPASS="true"` in `.env` to skip sign in and enter the app directly.
- Set `AUTH_BYPASS="false"` when you are ready to restore normal login.
- `AUTH_BYPASS` is automatically disabled when `NODE_ENV=production`.

## Tests

```bash
npm run test
```

## Security Notes

- Server-side validation via zod on mutation actions
- Password hashing with bcrypt (`bcryptjs`)
- Login rate limiting (in-memory baseline)
- Permission-based RBAC + privilege safety rules (no escalation, no peer/higher edits)
- Audit logging on auth, sessions, approvals, role/settings, and moderation events

## ERLC Integration Stub

- `lib/integrations/erlc.ts` contains a clean fake adapter interface for future live API wiring.
