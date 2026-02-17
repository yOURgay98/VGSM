# Discord Integration

ESS supports:

1. Discord account linking (OAuth)
2. Per-community Discord configuration (guild + channels + optional bot token)
3. Optional external Discord bot service (`services/discord-bot`) that calls ESS APIs using API keys

## 1) Discord Account Linking (OAuth)

Discord OAuth is **link-only** by default:

- Users must already be signed into ESS.
- Discord OAuth is used to attach a Discord identity to an existing ESS account.
- Discord OAuth cannot be used as a primary authentication method.

This is enforced in `proxy.ts` for the Discord provider routes.

### Required env vars

In `.env` (web app):

- `DISCORD_CLIENT_ID=...`
- `DISCORD_CLIENT_SECRET=...`

### UI

- `/app/settings/integrations/discord`

## 2) Community Discord Config

Each community can store:

- `guildId`
- optional channel ids for approvals/dispatch/security notifications
- optional bot token (encrypted at rest using `AUTH_ENCRYPTION_KEY`)

## 3) Discord Bot Service (Optional)

The bot lives in:

- `services/discord-bot`

It is designed to run as a separate process/service.

### Bot env vars

Create `services/discord-bot/.env`:

- `DISCORD_BOT_TOKEN=...`
- `DISCORD_APP_ID=...` (only needed for command registration)
- `DISCORD_GUILD_ID=...` (optional; if set registers commands to a single guild for fast iteration)
- `ESS_BASE_URL=http://localhost:3000`
- `ESS_API_KEY=...` (an ESS API key created from the Discord settings page)

### Register Slash Commands

From `services/discord-bot`:

```bash
cd services/discord-bot
npm install
npm run register
```

### Run Bot

```bash
cd services/discord-bot
npm run dev
```

Alternative (from repo root, no install in the service folder):

```bash
npx tsx services/discord-bot/src/register-commands.ts
npx tsx services/discord-bot/src/index.ts
```

## API Key Security

Bot calls are authenticated using `X-API-Key` and are permission-limited.

All bot-triggered actions are audited with metadata including:

- `source: "discord"`
- `guildId`
- `apiKeyId`
