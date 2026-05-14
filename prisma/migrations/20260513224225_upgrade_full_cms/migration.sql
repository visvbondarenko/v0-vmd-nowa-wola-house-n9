-- AlterTable
ALTER TABLE "PlanView" ADD COLUMN     "northAngle" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "investBuildingNr" TEXT,
ADD COLUMN     "investCity" TEXT,
ADD COLUMN     "investCounty" TEXT,
ADD COLUMN     "investMunicipality" TEXT,
ADD COLUMN     "investPostalCode" TEXT,
ADD COLUMN     "investStreet" TEXT,
ADD COLUMN     "investVoivodeship" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "northAngle" INTEGER,
ADD COLUMN     "propertyType" TEXT DEFAULT 'Mieszkanie',
ADD COLUMN     "prospektUrl" TEXT;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "fullPrice" INTEGER,
ADD COLUMN     "otherDesc" TEXT,
ADD COLUMN     "otherPrice" INTEGER,
ADD COLUMN     "parkingPrice" INTEGER,
ADD COLUMN     "partsLabel" TEXT,
ADD COLUMN     "partsType" TEXT,
ADD COLUMN     "rightsDesc" TEXT,
ADD COLUMN     "rightsPrice" INTEGER,
ADD COLUMN     "roomsLabel" TEXT,
ADD COLUMN     "roomsType" TEXT,
ADD COLUMN     "storagePrice" INTEGER;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalForm" TEXT,
    "nip" TEXT NOT NULL,
    "krs" TEXT,
    "ceidg" TEXT,
    "regon" TEXT NOT NULL,
    "addrVoivodeship" TEXT,
    "addrCounty" TEXT,
    "addrMunicipality" TEXT,
    "addrCity" TEXT,
    "addrStreet" TEXT,
    "addrBuildingNr" TEXT,
    "addrUnitNr" TEXT,
    "addrPostalCode" TEXT,
    "salesVoivodeship" TEXT,
    "salesCounty" TEXT,
    "salesMunicipality" TEXT,
    "salesCity" TEXT,
    "salesStreet" TEXT,
    "salesBuildingNr" TEXT,
    "salesUnitNr" TEXT,
    "salesPostalCode" TEXT,
    "salesAdditional" TEXT,
    "salesContact" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactFax" TEXT,
    "contactPerson" TEXT,
    "websiteUrl" TEXT,
    "extIdent" TEXT,
    "xmlBasePath" TEXT,
    "csvBasePath" TEXT,
    "lastXmlGeneratedAt" TIMESTAMP(3),
    "lastXmlError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitDotOverride" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "projectId" TEXT,
    "planViewId" TEXT,
    "stageViewId" TEXT,
    "dotX" DOUBLE PRECISION NOT NULL,
    "dotY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitDotOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "pricePerSqm" DOUBLE PRECISION,
    "totalPrice" INTEGER,
    "fullPrice" INTEGER,
    "parkingPrice" INTEGER,
    "storagePrice" INTEGER,
    "rightsPrice" INTEGER,
    "otherPrice" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "extIdent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "svgElementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageView" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "svgContent" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "northAngle" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "heading" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageUrl2" TEXT,
    "mapUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mapUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsBlock" (
    "id" TEXT NOT NULL,
    "newsPostId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingInvestment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusColor" TEXT NOT NULL DEFAULT '#6E2E2A',
    "icon" TEXT NOT NULL DEFAULT 'Clock',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpcomingInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewCity" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutSection" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "companyName" TEXT NOT NULL DEFAULT 'Nowa Wola House',
    "description" TEXT NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorResult" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "UnitDotOverride_projectId_idx" ON "UnitDotOverride"("projectId");

-- CreateIndex
CREATE INDEX "UnitDotOverride_planViewId_idx" ON "UnitDotOverride"("planViewId");

-- CreateIndex
CREATE INDEX "UnitDotOverride_stageViewId_idx" ON "UnitDotOverride"("stageViewId");

-- CreateIndex
CREATE INDEX "UnitDotOverride_unitId_idx" ON "UnitDotOverride"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitDotOverride_unitId_projectId_key" ON "UnitDotOverride"("unitId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitDotOverride_unitId_planViewId_key" ON "UnitDotOverride"("unitId", "planViewId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitDotOverride_unitId_stageViewId_key" ON "UnitDotOverride"("unitId", "stageViewId");

-- CreateIndex
CREATE INDEX "PriceHistory_unitId_date_idx" ON "PriceHistory"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedFile_path_key" ON "GeneratedFile"("path");

-- CreateIndex
CREATE INDEX "GeneratedFile_companyId_idx" ON "GeneratedFile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_projectId_svgElementId_key" ON "Stage"("projectId", "svgElementId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSection_projectId_type_key" ON "ProjectSection"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");

-- CreateIndex
CREATE INDEX "NewsBlock_newsPostId_idx" ON "NewsBlock"("newsPostId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitorResult_date_key" ON "MonitorResult"("date");

-- CreateIndex
CREATE INDEX "MonitorResult_date_idx" ON "MonitorResult"("date");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "Unit_companyId_idx" ON "Unit"("companyId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitDotOverride" ADD CONSTRAINT "UnitDotOverride_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitDotOverride" ADD CONSTRAINT "UnitDotOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitDotOverride" ADD CONSTRAINT "UnitDotOverride_planViewId_fkey" FOREIGN KEY ("planViewId") REFERENCES "PlanView"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitDotOverride" ADD CONSTRAINT "UnitDotOverride_stageViewId_fkey" FOREIGN KEY ("stageViewId") REFERENCES "StageView"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedFile" ADD CONSTRAINT "GeneratedFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageView" ADD CONSTRAINT "StageView_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSection" ADD CONSTRAINT "ProjectSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionItem" ADD CONSTRAINT "SectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ProjectSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsBlock" ADD CONSTRAINT "NewsBlock_newsPostId_fkey" FOREIGN KEY ("newsPostId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

