-- CreateTable
CREATE TABLE "DiscordAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "username" TEXT,
    "discriminator" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordCommunityConfig" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "botTokenEnc" TEXT,
    "approvalsChannelId" TEXT,
    "dispatchChannelId" TEXT,
    "securityChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordCommunityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordAccount_userId_key" ON "DiscordAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordAccount_discordUserId_key" ON "DiscordAccount"("discordUserId");

-- CreateIndex
CREATE INDEX "DiscordAccount_discordUserId_idx" ON "DiscordAccount"("discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordCommunityConfig_communityId_key" ON "DiscordCommunityConfig"("communityId");

-- CreateIndex
CREATE INDEX "DiscordCommunityConfig_guildId_idx" ON "DiscordCommunityConfig"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_communityId_createdAt_idx" ON "ApiKey"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_communityId_revokedAt_idx" ON "ApiKey"("communityId", "revokedAt");

-- AddForeignKey
ALTER TABLE "DiscordAccount" ADD CONSTRAINT "DiscordAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordCommunityConfig" ADD CONSTRAINT "DiscordCommunityConfig_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
