-- DropIndex
DROP INDEX "Action_createdAt_idx";

-- DropIndex
DROP INDEX "Action_type_idx";

-- DropIndex
DROP INDEX "ApprovalRequest_requestedByUserId_createdAt_idx";

-- DropIndex
DROP INDEX "ApprovalRequest_status_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "Case_status_idx";

-- DropIndex
DROP INDEX "CaseInternalNote_caseId_createdAt_idx";

-- DropIndex
DROP INDEX "CaseTag_tagId_idx";

-- DropIndex
DROP INDEX "CaseTemplate_name_key";

-- DropIndex
DROP INDEX "CommandExecution_commandId_createdAt_idx";

-- DropIndex
DROP INDEX "CommandExecution_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Comment_caseId_createdAt_idx";

-- DropIndex
DROP INDEX "PlayerInternalNote_playerId_createdAt_idx";

-- DropIndex
DROP INDEX "PlayerTag_tagId_idx";

-- DropIndex
DROP INDEX "Report_createdAt_idx";

-- DropIndex
DROP INDEX "Report_status_idx";

-- DropIndex
DROP INDEX "SavedView_userId_scope_name_key";

-- DropIndex
DROP INDEX "SavedView_userId_scope_updatedAt_idx";

-- DropIndex
DROP INDEX "Setting_key_key";

-- DropIndex
DROP INDEX "Tag_name_key";

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "communityId" TEXT;

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "CaseInternalNote" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "CaseTag" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "CaseTemplate" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "CommandExecution" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "CommandToggle" DROP CONSTRAINT "CommandToggle_pkey",
ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default',
ADD CONSTRAINT "CommandToggle_pkey" PRIMARY KEY ("communityId", "id");

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "role",
ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default',
ADD COLUMN     "require2fa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "PlayerInternalNote" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "PlayerTag" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "SavedView" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "activeCommunityId" TEXT;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "communityId" TEXT NOT NULL DEFAULT 'community_default';

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- Seed a default community so existing rows that default to `community_default`
-- can satisfy the foreign keys added later in this migration.
INSERT INTO "Community" ("id", "name", "slug", "settingsJson", "createdAt", "updatedAt")
VALUES ('community_default', 'Default Community', 'default', '{}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- CreateTable
CREATE TABLE "CommunityMembership" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRole" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRolePermission" (
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "CommunityRolePermission_pkey" PRIMARY KEY ("roleId","permission")
);

-- CreateTable
CREATE TABLE "InviteTemplate" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultRoleId" TEXT NOT NULL,
    "expiresInMinutes" INTEGER,
    "maxUses" INTEGER,
    "require2fa" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "CommunityMembership_communityId_createdAt_idx" ON "CommunityMembership"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityMembership_userId_createdAt_idx" ON "CommunityMembership"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityMembership_communityId_roleId_idx" ON "CommunityMembership"("communityId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMembership_communityId_userId_key" ON "CommunityMembership"("communityId", "userId");

-- CreateIndex
CREATE INDEX "CommunityRole_communityId_priority_idx" ON "CommunityRole"("communityId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRole_communityId_name_key" ON "CommunityRole"("communityId", "name");

-- CreateIndex
CREATE INDEX "CommunityRolePermission_permission_idx" ON "CommunityRolePermission"("permission");

-- CreateIndex
CREATE INDEX "InviteTemplate_communityId_createdAt_idx" ON "InviteTemplate"("communityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InviteTemplate_communityId_name_key" ON "InviteTemplate"("communityId", "name");

-- CreateIndex
CREATE INDEX "Action_communityId_type_createdAt_idx" ON "Action"("communityId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Action_communityId_playerId_createdAt_idx" ON "Action"("communityId", "playerId", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_communityId_status_createdAt_idx" ON "ApprovalRequest"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_communityId_requestedByUserId_createdAt_idx" ON "ApprovalRequest"("communityId", "requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_communityId_eventType_createdAt_idx" ON "AuditLog"("communityId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_communityId_createdAt_idx" ON "AuditLog"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "Case_communityId_status_createdAt_idx" ON "Case"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Case_communityId_assignedToUserId_updatedAt_idx" ON "Case"("communityId", "assignedToUserId", "updatedAt");

-- CreateIndex
CREATE INDEX "CaseInternalNote_communityId_caseId_createdAt_idx" ON "CaseInternalNote"("communityId", "caseId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseTag_communityId_tagId_idx" ON "CaseTag"("communityId", "tagId");

-- CreateIndex
CREATE INDEX "CaseTemplate_communityId_updatedAt_idx" ON "CaseTemplate"("communityId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseTemplate_communityId_name_key" ON "CaseTemplate"("communityId", "name");

-- CreateIndex
CREATE INDEX "CommandExecution_communityId_userId_createdAt_idx" ON "CommandExecution"("communityId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandExecution_communityId_commandId_createdAt_idx" ON "CommandExecution"("communityId", "commandId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandToggle_communityId_updatedAt_idx" ON "CommandToggle"("communityId", "updatedAt");

-- CreateIndex
CREATE INDEX "Comment_communityId_caseId_createdAt_idx" ON "Comment"("communityId", "caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Invite_communityId_createdAt_idx" ON "Invite"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "Player_communityId_status_updatedAt_idx" ON "Player"("communityId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Player_communityId_createdAt_idx" ON "Player"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerInternalNote_communityId_playerId_createdAt_idx" ON "PlayerInternalNote"("communityId", "playerId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerTag_communityId_tagId_idx" ON "PlayerTag"("communityId", "tagId");

-- CreateIndex
CREATE INDEX "Report_communityId_status_createdAt_idx" ON "Report"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_communityId_assignedToUserId_createdAt_idx" ON "Report"("communityId", "assignedToUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_communityId_createdAt_idx" ON "Report"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedView_communityId_userId_scope_updatedAt_idx" ON "SavedView"("communityId", "userId", "scope", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedView_communityId_userId_scope_name_key" ON "SavedView"("communityId", "userId", "scope", "name");

-- CreateIndex
CREATE INDEX "Session_activeCommunityId_lastActiveAt_idx" ON "Session"("activeCommunityId", "lastActiveAt");

-- CreateIndex
CREATE INDEX "Setting_communityId_updatedAt_idx" ON "Setting"("communityId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_communityId_key_key" ON "Setting"("communityId", "key");

-- CreateIndex
CREATE INDEX "Tag_communityId_updatedAt_idx" ON "Tag"("communityId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_communityId_name_key" ON "Tag"("communityId", "name");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CommunityRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InviteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_activeCommunityId_fkey" FOREIGN KEY ("activeCommunityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandToggle" ADD CONSTRAINT "CommandToggle_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandExecution" ADD CONSTRAINT "CommandExecution_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerTag" ADD CONSTRAINT "PlayerTag_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTemplate" ADD CONSTRAINT "CaseTemplate_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInternalNote" ADD CONSTRAINT "PlayerInternalNote_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseInternalNote" ADD CONSTRAINT "CaseInternalNote_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMembership" ADD CONSTRAINT "CommunityMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CommunityRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRole" ADD CONSTRAINT "CommunityRole_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRolePermission" ADD CONSTRAINT "CommunityRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CommunityRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteTemplate" ADD CONSTRAINT "InviteTemplate_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteTemplate" ADD CONSTRAINT "InviteTemplate_defaultRoleId_fkey" FOREIGN KEY ("defaultRoleId") REFERENCES "CommunityRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
