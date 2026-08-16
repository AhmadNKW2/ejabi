-- Majors belong to fields
ALTER TABLE "Major" ADD COLUMN "fieldId" TEXT;

UPDATE "Major" m
SET "fieldId" = f.id
FROM "Field" f
WHERE (m.slug = 'business' AND f.slug = 'biz')
   OR (m.slug = 'ai' AND f.slug = 'tech')
   OR (m.slug = 'aviation' AND f.slug = 'tourism')
   OR (m.slug = 'pharmacy' AND f.slug = 'health')
   OR (m.slug = 'nursing' AND f.slug = 'health')
   OR (m.slug = 'mecheng' AND f.slug = 'eng')
   OR (m.slug = 'eleceng' AND f.slug = 'eng')
   OR (m.slug = 'custom' AND f.slug = 'biz');

UPDATE "Major"
SET "fieldId" = (SELECT id FROM "Field" ORDER BY "sortOrder" ASC LIMIT 1)
WHERE "fieldId" IS NULL;

ALTER TABLE "Major" ALTER COLUMN "fieldId" SET NOT NULL;

ALTER TABLE "Major" ADD CONSTRAINT "Major_fieldId_fkey"
  FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Major_fieldId_idx" ON "Major"("fieldId");

-- Universities offer specialties
CREATE TABLE "UniversityMajor" (
  "universityId" TEXT NOT NULL,
  "majorId" TEXT NOT NULL,
  CONSTRAINT "UniversityMajor_pkey" PRIMARY KEY ("universityId","majorId"),
  CONSTRAINT "UniversityMajor_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UniversityMajor_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "UniversityMajor" ("universityId", "majorId")
SELECT u.id, m.id
FROM "University" u
CROSS JOIN "Major" m
WHERE m."isCustom" = false;
