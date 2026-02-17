import "dotenv/config";

import { Client, GatewayIntentBits } from "discord.js";

type Json = Record<string, unknown>;

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const ESS_BASE_URL = (process.env.ESS_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const ESS_API_KEY = process.env.ESS_API_KEY ?? "";

if (!DISCORD_BOT_TOKEN) {
  console.error("[discord-bot] DISCORD_BOT_TOKEN is required.");
  process.exit(1);
}
if (!ESS_API_KEY) {
  console.error("[discord-bot] ESS_API_KEY is required.");
  process.exit(1);
}

async function post<T>(path: string, body: Json): Promise<T> {
  const res = await fetch(`${ESS_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ESS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`[discord-bot] Logged in as ${client.user?.tag ?? "unknown"}`);
  console.log(`[discord-bot] ESS base url: ${ESS_BASE_URL}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: "This command must be run inside a server.",
      ephemeral: true,
    });
    return;
  }

  const discordUserId = interaction.user.id;

  try {
    if (interaction.commandName === "ess") {
      const sub = interaction.options.getSubcommand();

      if (sub === "approvals") {
        const result = await post<{ ok: true; approvals: Array<any> }>("/api/bot/approvals/list", {
          guildId,
          discordUserId,
        });

        if (result.approvals.length === 0) {
          await interaction.reply({ content: "No pending approvals.", ephemeral: true });
          return;
        }

        const lines = result.approvals.map((a) => {
          const cmdId = (a.payloadJson as any)?.commandId ?? "command";
          const who = a.requestedBy?.name ?? "unknown";
          return `- ${a.id} [${a.riskLevel}] ${cmdId} (requested by ${who})`;
        });

        await interaction.reply({
          content: `Pending approvals:\n${lines.join("\n")}`,
          ephemeral: true,
        });
        return;
      }

      if (sub === "approve") {
        const approvalId = interaction.options.getString("id", true);

        await interaction.deferReply({ ephemeral: true });
        const result = await post<{ ok: true; result: { message: string } }>(
          "/api/bot/approvals/approve",
          {
            guildId,
            discordUserId,
            approvalId,
          },
        );

        await interaction.editReply(result.result?.message ?? "Approved.");
        return;
      }

      if (sub === "dispatch_calls") {
        const result = await post<{ ok: true; openCount: number; calls: Array<any> }>(
          "/api/bot/dispatch/calls",
          {
            guildId,
            discordUserId,
          },
        );

        if (result.calls.length === 0) {
          await interaction.reply({
            content: `No open calls. (${result.openCount})`,
            ephemeral: true,
          });
          return;
        }

        const lines = result.calls.map(
          (c) =>
            `- [P${c.priority}] ${c.status} ${c.title}${c.locationName ? ` @ ${c.locationName}` : ""}`,
        );
        await interaction.reply({
          content: `Open calls (${result.openCount}):\n${lines.join("\n")}`,
          ephemeral: true,
        });
        return;
      }

      if (sub === "whois") {
        const query = interaction.options.getString("query", true);
        const result = await post<{ ok: true; players: Array<any> }>("/api/bot/players/whois", {
          guildId,
          discordUserId,
          query,
        });

        if (result.players.length === 0) {
          await interaction.reply({ content: "No players found.", ephemeral: true });
          return;
        }

        const lines = result.players.map(
          (p) => `- ${p.name} (${p.status}) ${p.robloxId ? `roblox:${p.robloxId}` : ""}`,
        );
        await interaction.reply({ content: `Matches:\n${lines.join("\n")}`, ephemeral: true });
        return;
      }
    }

    await interaction.reply({ content: "Unknown command.", ephemeral: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Command failed.";
    const safe = message.length > 1800 ? `${message.slice(0, 1800)}...` : message;
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`Error: ${safe}`);
    } else {
      await interaction.reply({ content: `Error: ${safe}`, ephemeral: true });
    }
  }
});

await client.login(DISCORD_BOT_TOKEN);
