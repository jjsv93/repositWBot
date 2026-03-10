/*
  Warnings:

  - A unique constraint covering the columns `[borrowerId]` on the table `Loan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId]` on the table `Loan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId]` on the table `Loan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "borrowerId" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "propertyId" TEXT;

-- CreateTable
CREATE TABLE "Borrower" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "creditScore" INTEGER,
    "liquidity" DOUBLE PRECISION,
    "netWorth" DOUBLE PRECISION,
    "experience" INTEGER,

    CONSTRAINT "Borrower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType",
    "entityName" TEXT,
    "ein" TEXT,
    "stateOfFormation" TEXT,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "taxFrequency" TEXT,
    "insuranceAmount" DOUBLE PRECISION,
    "insuranceFrequency" TEXT,
    "monthlyRent" DOUBLE PRECISION,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Loan_borrowerId_key" ON "Loan"("borrowerId");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_entityId_key" ON "Loan"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_propertyId_key" ON "Loan"("propertyId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
