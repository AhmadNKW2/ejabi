-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "catalogView" TEXT NOT NULL DEFAULT 'view1',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSettings" ("id", "catalogView", "updatedAt") VALUES ('default', 'view1', CURRENT_TIMESTAMP);
