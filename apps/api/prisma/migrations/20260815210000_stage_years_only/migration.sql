ALTER TABLE "Stage" ADD COLUMN "years" INTEGER NOT NULL DEFAULT 4;

UPDATE "Stage" SET "years" = 2 WHERE "slug" = 'diploma';
UPDATE "Stage" SET "years" = 4 WHERE "slug" = 'bachelor';
UPDATE "Stage" SET "years" = 2 WHERE "slug" = 'master';
UPDATE "Stage" SET "years" = 4 WHERE "slug" = 'phd';

DROP TABLE IF EXISTS "DurationOverride";
DROP TABLE IF EXISTS "DurationRule";
