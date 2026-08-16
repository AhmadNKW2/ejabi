-- Price is per university + specialty

ALTER TABLE "UniversityMajor" ADD COLUMN "annualCostUsd" INTEGER;

UPDATE "UniversityMajor" um
SET "annualCostUsd" = mp."annualCostUsd"
FROM "University" u, "MajorPrice" mp
WHERE um."universityId" = u.id
  AND mp."majorId" = um."majorId"
  AND mp."countryId" = u."countryId";

DROP TABLE IF EXISTS "MajorPrice";
