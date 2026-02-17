# ESS Discord Bot (Scaffold)

This is an optional companion service that connects Discord slash commands to the ESS API.

## Requirements

- Node.js (same major as the web app)
- The ESS web app running (for `/api/bot/*` endpoints)
- Discord bot application + token
- An ESS API key (created in ESS: `Settings -> Discord -> Bot API Keys`)

## Environment

Create `services/discord-bot/.env`:

```bash
DISCORD_APP_ID=123456789012345678
DISCORD_BOT_TOKEN=your-bot-token

# Optional: faster command iteration
DISCORD_GUILD_ID=123456789012345678

ESS_BASE_URL=http://localhost:3000
ESS_API_KEY=your-ess-api-key
```

## Register Slash Commands

Run from the repo root:

```bash
npx tsx services/discord-bot/src/register-commands.ts
```

If `DISCORD_GUILD_ID` is set, commands are registered for that guild only (recommended for development).

## Run The Bot

```bash
npx tsx services/discord-bot/src/index.ts
```

## Security Notes

- The ESS API verifies:
  - API key validity + permissions
  - guildId scope (matches the community Discord config)
  - Discord user linkage to an ESS user account
  - RBAC permissions for the linked user
- By default, Discord OAuth is restricted to account linking (not sign-in).
