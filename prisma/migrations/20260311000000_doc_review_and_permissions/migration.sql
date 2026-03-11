-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable - Add document review fields
ALTER TABLE "Document" ADD COLUMN "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Document" ADD COLUMN "reviewerNote" TEXT;
ALTER TABLE "Document" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Document" ADD COLUMN "reviewedAt" TIMESTAMP(3);
