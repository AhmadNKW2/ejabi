CREATE TABLE "UniversityStage" (
    "universityId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,

    CONSTRAINT "UniversityStage_pkey" PRIMARY KEY ("universityId","stageId")
);

CREATE TABLE "UniversityMajorStage" (
    "universityId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "costUsd" INTEGER,

    CONSTRAINT "UniversityMajorStage_pkey" PRIMARY KEY ("universityId","majorId","stageId")
);

INSERT INTO "UniversityStage" ("universityId", "stageId")
SELECT u."id", s."id" FROM "University" u CROSS JOIN "Stage" s;

INSERT INTO "UniversityMajorStage" ("universityId", "majorId", "stageId", "costUsd")
SELECT um."universityId", um."majorId", s."id",
  CASE WHEN um."annualCostUsd" IS NULL THEN NULL ELSE um."annualCostUsd" * s."years" END
FROM "UniversityMajor" um
CROSS JOIN "Stage" s;

ALTER TABLE "UniversityMajor" DROP COLUMN "annualCostUsd";

ALTER TABLE "UniversityStage" ADD CONSTRAINT "UniversityStage_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityStage" ADD CONSTRAINT "UniversityStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityMajorStage" ADD CONSTRAINT "UniversityMajorStage_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityMajorStage" ADD CONSTRAINT "UniversityMajorStage_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityMajorStage" ADD CONSTRAINT "UniversityMajorStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
