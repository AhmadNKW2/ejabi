-- Specialty prices per country; drop cost multipliers and major base cost

CREATE TABLE "MajorPrice" (
  "id" TEXT NOT NULL,
  "majorId" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "annualCostUsd" INTEGER NOT NULL,
  CONSTRAINT "MajorPrice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MajorPrice_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MajorPrice_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MajorPrice_majorId_countryId_key" ON "MajorPrice"("majorId", "countryId");

INSERT INTO "MajorPrice" ("id", "majorId", "countryId", "annualCostUsd")
SELECT
  md5(random()::text || clock_timestamp()::text || m.id || c.id),
  m.id,
  c.id,
  (ROUND((COALESCE(m."baseCostUsd", 0) * c."costMultiplier") / 500) * 500)::int
FROM "Major" m
CROSS JOIN "Country" c
WHERE m."isCustom" = false AND m."baseCostUsd" IS NOT NULL;

ALTER TABLE "Country" DROP COLUMN "costMultiplier";
ALTER TABLE "Stage" DROP COLUMN "costMultiplier";
ALTER TABLE "Major" DROP COLUMN "baseCostUsd";
