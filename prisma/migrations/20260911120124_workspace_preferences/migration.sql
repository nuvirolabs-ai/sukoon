-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "referralCode" TEXT NOT NULL DEFAULT '';
