-- CreateEnum
CREATE TYPE "DispatchUnitType" AS ENUM ('LEO', 'EMS', 'FIRE', 'CIV');

-- CreateEnum
CREATE TYPE "DispatchUnitStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'ENROUTE', 'ON_SCENE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "DispatchCallStatus" AS ENUM ('OPEN', 'ASSIGNED', 'ENROUTE', 'ON_SCENE', 'CLEARED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DispatchUnit" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "callSign" TEXT NOT NULL,
    "type" "DispatchUnitType" NOT NULL,
    "status" "DispatchUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignedCallId" TEXT,
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchCall" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "status" "DispatchCallStatus" NOT NULL DEFAULT 'OPEN',
    "locationName" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchAssignment" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "callId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchEvent" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "callId" TEXT,
    "unitId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "supervisorUserId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadioLog" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "callId" TEXT,
    "unitId" TEXT,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadioLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchUnit_communityId_status_updatedAt_idx" ON "DispatchUnit"("communityId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "DispatchUnit_communityId_assignedCallId_idx" ON "DispatchUnit"("communityId", "assignedCallId");

-- CreateIndex
CREATE INDEX "DispatchUnit_communityId_createdAt_idx" ON "DispatchUnit"("communityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchUnit_communityId_callSign_key" ON "DispatchUnit"("communityId", "callSign");

-- CreateIndex
CREATE INDEX "DispatchCall_communityId_status_createdAt_idx" ON "DispatchCall"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchCall_communityId_priority_createdAt_idx" ON "DispatchCall"("communityId", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchCall_communityId_createdAt_idx" ON "DispatchCall"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchAssignment_communityId_callId_assignedAt_idx" ON "DispatchAssignment"("communityId", "callId", "assignedAt");

-- CreateIndex
CREATE INDEX "DispatchAssignment_communityId_unitId_assignedAt_idx" ON "DispatchAssignment"("communityId", "unitId", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchAssignment_callId_unitId_key" ON "DispatchAssignment"("callId", "unitId");

-- CreateIndex
CREATE INDEX "DispatchEvent_communityId_createdAt_idx" ON "DispatchEvent"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchEvent_communityId_callId_createdAt_idx" ON "DispatchEvent"("communityId", "callId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchEvent_communityId_unitId_createdAt_idx" ON "DispatchEvent"("communityId", "unitId", "createdAt");

-- CreateIndex
CREATE INDEX "Shift_communityId_startAt_idx" ON "Shift"("communityId", "startAt");

-- CreateIndex
CREATE INDEX "RadioLog_communityId_createdAt_idx" ON "RadioLog"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "RadioLog_communityId_callId_createdAt_idx" ON "RadioLog"("communityId", "callId", "createdAt");

-- CreateIndex
CREATE INDEX "RadioLog_communityId_unitId_createdAt_idx" ON "RadioLog"("communityId", "unitId", "createdAt");

-- AddForeignKey
ALTER TABLE "DispatchUnit" ADD CONSTRAINT "DispatchUnit_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchUnit" ADD CONSTRAINT "DispatchUnit_assignedCallId_fkey" FOREIGN KEY ("assignedCallId") REFERENCES "DispatchCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchCall" ADD CONSTRAINT "DispatchCall_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchCall" ADD CONSTRAINT "DispatchCall_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "DispatchCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "DispatchUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchAssignment" ADD CONSTRAINT "DispatchAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_callId_fkey" FOREIGN KEY ("callId") REFERENCES "DispatchCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "DispatchUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_supervisorUserId_fkey" FOREIGN KEY ("supervisorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadioLog" ADD CONSTRAINT "RadioLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadioLog" ADD CONSTRAINT "RadioLog_callId_fkey" FOREIGN KEY ("callId") REFERENCES "DispatchCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadioLog" ADD CONSTRAINT "RadioLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "DispatchUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadioLog" ADD CONSTRAINT "RadioLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
