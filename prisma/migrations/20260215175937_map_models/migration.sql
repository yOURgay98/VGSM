-- CreateTable
CREATE TABLE "MapPOI" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapPOI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapZone" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "name" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL DEFAULT 'patrol',
    "geojson" JSONB NOT NULL,
    "color" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapViewState" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL DEFAULT 'community_default',
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'dispatch',
    "centerLat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "centerLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zoom" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "enabledLayers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapViewState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MapPOI_communityId_category_idx" ON "MapPOI"("communityId", "category");

-- CreateIndex
CREATE INDEX "MapPOI_communityId_createdAt_idx" ON "MapPOI"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "MapZone_communityId_zoneType_idx" ON "MapZone"("communityId", "zoneType");

-- CreateIndex
CREATE INDEX "MapZone_communityId_createdAt_idx" ON "MapZone"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "MapViewState_communityId_userId_idx" ON "MapViewState"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MapViewState_communityId_userId_scope_key" ON "MapViewState"("communityId", "userId", "scope");

-- AddForeignKey
ALTER TABLE "MapPOI" ADD CONSTRAINT "MapPOI_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapPOI" ADD CONSTRAINT "MapPOI_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapZone" ADD CONSTRAINT "MapZone_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapZone" ADD CONSTRAINT "MapZone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapViewState" ADD CONSTRAINT "MapViewState_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapViewState" ADD CONSTRAINT "MapViewState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
