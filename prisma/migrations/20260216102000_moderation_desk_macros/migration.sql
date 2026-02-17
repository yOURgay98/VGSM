-- CreateEnum
CREATE TYPE "ModerationMacroType" AS ENUM ('REPORT_RESOLUTION', 'NOTE', 'WARNING', 'BAN_REASON');

-- CreateTable
CREATE TABLE "ModerationMacro" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "name" TEXT NOT NULL,
    "type" "ModerationMacroType" NOT NULL,
    "templateText" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationMacro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationMacro_communityId_type_createdAt_idx" ON "ModerationMacro"("communityId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationMacro_communityId_createdAt_idx" ON "ModerationMacro"("communityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModerationMacro_communityId_name_key" ON "ModerationMacro"("communityId", "name");

-- AddForeignKey
ALTER TABLE "ModerationMacro" ADD CONSTRAINT "ModerationMacro_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationMacro" ADD CONSTRAINT "ModerationMacro_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
