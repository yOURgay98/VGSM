import "dotenv/config";

import { REST, Routes, SlashCommandBuilder } from "discord.js";

const DISCORD_APP_ID = process.env.DISCORD_APP_ID ?? "";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID ?? "";

if (!DISCORD_APP_ID) {
  console.error("[discord-bot] DISCORD_APP_ID is required.");
  process.exit(1);
}
if (!DISCORD_BOT_TOKEN) {
  console.error("[discord-bot] DISCORD_BOT_TOKEN is required.");
  process.exit(1);
}

const command = new SlashCommandBuilder()
  .setName("ess")
  .setDescription("ESS moderation and operations commands")
  .addSubcommand((sub) => sub.setName("approvals").setDescription("List pending approval requests"))
  .addSubcommand((sub) =>
    sub
      .setName("approve")
      .setDescription("Approve a pending approval request")
      .addStringOption((opt) =>
        opt.setName("id").setDescription("Approval request id").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("dispatch_calls").setDescription("Show open dispatch calls summary"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("whois")
      .setDescription("Search players by name or Roblox id")
      .addStringOption((opt) =>
        opt.setName("query").setDescription("Player name or Roblox id").setRequired(true),
      ),
  );

const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);

async function main() {
  const json = [command.toJSON()];
  if (DISCORD_GUILD_ID) {
    console.log(`[discord-bot] Registering guild commands for ${DISCORD_GUILD_ID}...`);
    await rest.put(Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID), {
      body: json,
    });
  } else {
    console.log("[discord-bot] Registering global commands...");
    await rest.put(Routes.applicationCommands(DISCORD_APP_ID), { body: json });
  }
  console.log("[discord-bot] Commands registered.");
}

main().catch((err) => {
  console.error("[discord-bot] Failed to register commands.", err);
  process.exit(1);
});
