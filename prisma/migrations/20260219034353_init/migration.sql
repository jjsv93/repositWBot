-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PROCESSING', 'APPROVED', 'CONDITIONS', 'UNDERWRITING', 'CTC', 'FUNDED');

-- CreateEnum
CREATE TYPE "ConditionStatus" AS ENUM ('OPEN', 'SUBMITTED', 'REJECTED', 'CLEARED');

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "borrower" TEXT NOT NULL,
    "property" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "ConditionStatus" NOT NULL,
    "loanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
