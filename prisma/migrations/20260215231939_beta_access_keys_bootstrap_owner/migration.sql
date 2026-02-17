-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forceChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BetaAccessKey" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "keyHash" TEXT NOT NULL,
    "label" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "BetaAccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaAccessKey_keyHash_key" ON "BetaAccessKey"("keyHash");

-- CreateIndex
CREATE INDEX "BetaAccessKey_communityId_createdAt_idx" ON "BetaAccessKey"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "BetaAccessKey_communityId_revokedAt_idx" ON "BetaAccessKey"("communityId", "revokedAt");

-- CreateIndex
CREATE INDEX "BetaAccessKey_communityId_expiresAt_idx" ON "BetaAccessKey"("communityId", "expiresAt");

-- AddForeignKey
ALTER TABLE "BetaAccessKey" ADD CONSTRAINT "BetaAccessKey_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaAccessKey" ADD CONSTRAINT "BetaAccessKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
