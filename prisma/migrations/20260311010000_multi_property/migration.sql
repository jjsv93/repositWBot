-- CreateEnum
CREATE TYPE "ConditionCategory" AS ENUM ('BORROWER', 'ENTITY', 'PROPERTY', 'GENERAL');

-- AlterTable - Add isPortfolio to Loan
ALTER TABLE "Loan" ADD COLUMN "isPortfolio" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable - Add loanId, city, state, zip to Property
ALTER TABLE "Property" ADD COLUMN "loanId" TEXT;
ALTER TABLE "Property" ADD COLUMN "city" TEXT;
ALTER TABLE "Property" ADD COLUMN "state" TEXT;
ALTER TABLE "Property" ADD COLUMN "zip" TEXT;
ALTER TABLE "Property" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing property data: set loanId from Loan.propertyId
UPDATE "Property" p SET "loanId" = l."id"
FROM "Loan" l WHERE l."propertyId" = p."id";

-- AlterTable - Add propertyId and category to Condition
ALTER TABLE "Condition" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "Condition" ADD COLUMN "category" "ConditionCategory" NOT NULL DEFAULT 'GENERAL';

-- DropForeignKey (old 1:1 relation)
ALTER TABLE "Loan" DROP CONSTRAINT IF EXISTS "Loan_propertyId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Loan_propertyId_key";

-- AlterTable - Drop old propertyId from Loan
ALTER TABLE "Loan" DROP COLUMN IF EXISTS "propertyId";

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
