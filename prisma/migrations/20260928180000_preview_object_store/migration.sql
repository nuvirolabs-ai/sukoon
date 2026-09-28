-- Preview-only document bytes. Not a scan verdict and not private object storage.
CREATE TABLE "PreviewObject" (
    "storageKey" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewObject_pkey" PRIMARY KEY ("storageKey")
);
