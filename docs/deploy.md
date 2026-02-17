# VSM Deployment Guide

This guide covers a safe production deployment for **Vanguard Security & Management (VSM)**.

## 1) Choose a hosting model

### Option A: Managed platform (recommended)

- App: Vercel (or another managed Next.js host)
- Database: Managed PostgreSQL (Neon, Supabase, Railway, RDS)

### Option B: Self-host

- App: Node.js process (`next start`) behind Nginx/Caddy
- Database: PostgreSQL with backups and TLS

## 2) Required environment variables

Set these in your hosting provider secrets panel (never commit to git):

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_ENCRYPTION_KEY`
- `OWNER_EMAIL`
- `OWNER_BOOTSTRAP_PASSWORD`

Recommended optional vars:

- `NODE_ENV=production`
- `AUTH_BYPASS=false`
- `AUTH_BYPASS_UNSAFE=false`

### Example (`.env.production`)

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/vsm?sslmode=require"
NEXTAUTH_SECRET="replace-with-64+char-random-secret"
NEXTAUTH_URL="https://vsm.yourdomain.com"
AUTH_ENCRYPTION_KEY="replace-with-32-byte-base64-or-hex"
OWNER_EMAIL="owner@yourdomain.com"
OWNER_BOOTSTRAP_PASSWORD="replace-with-strong-temp-password"
AUTH_BYPASS="false"
AUTH_BYPASS_UNSAFE="false"
```

## 3) Provision the database

1. Create PostgreSQL instance.
2. Restrict network access to app hosts only.
3. Enable automated backups and point-in-time recovery if available.

## 4) Install and build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

## 5) First secure bootstrap

1. Start the app with env vars above.
2. Sign in with `OWNER_EMAIL` and `OWNER_BOOTSTRAP_PASSWORD`.
3. Immediately change owner password.
4. Enroll 2FA for OWNER/ADMIN roles.
5. Rotate `OWNER_BOOTSTRAP_PASSWORD` in your secrets manager.

## 6) Post-deploy verification checklist

- [ ] `https://your-domain/` loads successfully.
- [ ] Sign in works.
- [ ] Sign out returns to `/` (no 404).
- [ ] `/app` requires auth and redirects cleanly to `/login` if unauthenticated.
- [ ] Invite/access key redemption is rate-limited.
- [ ] Security headers are present in responses.
- [ ] Audit events are written for sign-in/sign-out/key actions.

## 7) Production safety checklist

- [ ] `NEXTAUTH_URL` matches real HTTPS domain.
- [ ] TLS certificate enabled.
- [ ] DB backups enabled.
- [ ] Secrets stored in host secret manager (not repo).
- [ ] Regular secret rotation policy (90 days or less).
- [ ] Owner/admin accounts have 2FA enabled.
- [ ] Minimal permissions granted to non-owner roles.

## 8) Ongoing operations

- Monitor login failures and lockouts daily.
- Review audit integrity status regularly.
- Rotate API keys/tokens on schedule.
- Keep Node/Next/Prisma dependencies up to date.
