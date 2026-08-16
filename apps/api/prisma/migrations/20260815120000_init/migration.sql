-- CreateSchema
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'CONTACTED', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'CANCELLED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "costMultiplier" DECIMAL(6,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Field_slug_key" ON "Field"("slug");

CREATE TABLE "Major" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "baseCostUsd" INTEGER,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Major_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Major_slug_key" ON "Major"("slug");

CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "costMultiplier" DECIMAL(6,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Stage_slug_key" ON "Stage"("slug");

CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "University_countryId_slug_key" ON "University"("countryId", "slug");

CREATE TABLE "DurationRule" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "years" INTEGER NOT NULL,
    CONSTRAINT "DurationRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DurationRule_stageId_countryId_key" ON "DurationRule"("stageId", "countryId");

CREATE TABLE "DurationOverride" (
    "id" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "years" INTEGER NOT NULL,
    CONSTRAINT "DurationOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DurationOverride_majorId_stageId_countryId_key" ON "DurationOverride"("majorId", "stageId", "countryId");

CREATE TABLE "CompareItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "customMajorLabel" TEXT,
    "years" INTEGER NOT NULL,
    "annualCostUsd" INTEGER,
    "totalCostUsd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompareItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationChoice" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "preferenceOrder" INTEGER NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "majorLabel" TEXT NOT NULL,
    "stageLabel" TEXT NOT NULL,
    "countryLabel" TEXT NOT NULL,
    "universityLabel" TEXT NOT NULL,
    "years" INTEGER NOT NULL,
    "annualCostUsd" INTEGER,
    "totalCostUsd" INTEGER,
    CONSTRAINT "ApplicationChoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApplicationChoice_applicationId_preferenceOrder_key" ON "ApplicationChoice"("applicationId", "preferenceOrder");

ALTER TABLE "University" ADD CONSTRAINT "University_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurationRule" ADD CONSTRAINT "DurationRule_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurationRule" ADD CONSTRAINT "DurationRule_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurationOverride" ADD CONSTRAINT "DurationOverride_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurationOverride" ADD CONSTRAINT "DurationOverride_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurationOverride" ADD CONSTRAINT "DurationOverride_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON UPDATE CASCADE;
ALTER TABLE "CompareItem" ADD CONSTRAINT "CompareItem_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationChoice" ADD CONSTRAINT "ApplicationChoice_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
