/*
  Warnings:

  - This migration deletes existing invite rows to ensure raw tokens are not preserved.
    Invites are ephemeral and can be recreated after deploy.
*/

-- Invites must not store redeemable raw tokens. Clear existing invites first.
DELETE FROM "Invite";

-- Drop the raw token column and replace it with a hash + non-redeemable preview.
ALTER TABLE "Invite" DROP COLUMN "token";

ALTER TABLE "Invite"
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "tokenPreview" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Token hash is the unique lookup key (computed from the raw token).
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- Query helpers for operators.
CREATE INDEX "Invite_communityId_expiresAt_idx" ON "Invite"("communityId", "expiresAt");
CREATE INDEX "Invite_communityId_revokedAt_idx" ON "Invite"("communityId", "revokedAt");

