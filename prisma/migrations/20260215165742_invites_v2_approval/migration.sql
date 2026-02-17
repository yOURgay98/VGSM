-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "redeemedByUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InviteTemplate" ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;
