-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "currentPath" TEXT;

-- CreateTable
CREATE TABLE "SensitiveModeGrant" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensitiveModeGrant_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "CommandExecution" (
    "id" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerTag" (
    "playerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,

    CONSTRAINT "PlayerTag_pkey" PRIMARY KEY ("playerId","tagId")
);

-- CreateTable
CREATE TABLE "CaseTag" (
    "caseId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,

    CONSTRAINT "CaseTag_pkey" PRIMARY KEY ("caseId","tagId")
);

-- CreateTable
CREATE TABLE "CaseTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "descriptionTemplate" TEXT NOT NULL,
    "defaultStatus" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "CaseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerInternalNote" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseInternalNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SensitiveModeGrant_userId_expiresAt_idx" ON "SensitiveModeGrant"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "CommandExecution_userId_createdAt_idx" ON "CommandExecution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandExecution_commandId_createdAt_idx" ON "CommandExecution"("commandId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PlayerTag_tagId_idx" ON "PlayerTag"("tagId");

-- CreateIndex
CREATE INDEX "PlayerTag_assignedByUserId_assignedAt_idx" ON "PlayerTag"("assignedByUserId", "assignedAt");

-- CreateIndex
CREATE INDEX "CaseTag_tagId_idx" ON "CaseTag"("tagId");

-- CreateIndex
CREATE INDEX "CaseTag_assignedByUserId_assignedAt_idx" ON "CaseTag"("assignedByUserId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseTemplate_name_key" ON "CaseTemplate"("name");

-- CreateIndex
CREATE INDEX "PlayerInternalNote_playerId_createdAt_idx" ON "PlayerInternalNote"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseInternalNote_caseId_createdAt_idx" ON "CaseInternalNote"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "SensitiveModeGrant" ADD CONSTRAINT "SensitiveModeGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandExecution" ADD CONSTRAINT "CommandExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandExecution" ADD CONSTRAINT "CommandExecution_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTag" ADD CONSTRAINT "PlayerTag_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTag" ADD CONSTRAINT "PlayerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTag" ADD CONSTRAINT "PlayerTag_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTemplate" ADD CONSTRAINT "CaseTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTemplate" ADD CONSTRAINT "CaseTemplate_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInternalNote" ADD CONSTRAINT "PlayerInternalNote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInternalNote" ADD CONSTRAINT "PlayerInternalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInternalNote" ADD CONSTRAINT "CaseInternalNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInternalNote" ADD CONSTRAINT "CaseInternalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
