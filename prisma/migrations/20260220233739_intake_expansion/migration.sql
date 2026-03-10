-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('INDIVIDUAL', 'LLC_SINGLE', 'LLC_MULTI');

-- CreateEnum
CREATE TYPE "PrepayType" AS ENUM ('DECLINING', 'FLAT');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "annualInsurance" DOUBLE PRECISION,
ADD COLUMN     "annualTaxes" DOUBLE PRECISION,
ADD COLUMN     "borrowerEmail" TEXT,
ADD COLUMN     "borrowerFirstName" TEXT,
ADD COLUMN     "borrowerLastName" TEXT,
ADD COLUMN     "borrowerMiddleName" TEXT,
ADD COLUMN     "borrowerPhone" TEXT,
ADD COLUMN     "entityType" "EntityType",
ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "interestRate" DOUBLE PRECISION,
ADD COLUMN     "loanAmount" DOUBLE PRECISION,
ADD COLUMN     "ltv" DOUBLE PRECISION,
ADD COLUMN     "prepayType" "PrepayType",
ADD COLUMN     "prepayYears" INTEGER,
ADD COLUMN     "propertyAddress" TEXT,
ADD COLUMN     "termMonths" INTEGER;

-- CreateTable
CREATE TABLE "LoanActivity" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LoanActivity" ADD CONSTRAINT "LoanActivity_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
