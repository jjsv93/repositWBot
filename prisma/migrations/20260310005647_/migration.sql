/*
  Warnings:

  - The values [SUBMITTED,REJECTED] on the enum `ConditionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONDITIONS,UNDERWRITING,CTC] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrower` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerEmail` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerFirstName` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerLastName` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerMiddleName` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `borrowerPhone` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `property` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `propertyAddress` on the `Loan` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('LENDER', 'TITLE', 'INSURANCE');

-- CreateEnum
CREATE TYPE "LoanInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('DAILY', 'EVERY_2_DAYS', 'EVERY_3_DAYS', 'WEEKDAYS_ONLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "ConditionStatus_new" AS ENUM ('OPEN', 'RECEIVED', 'CLEARED');
ALTER TABLE "Condition" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Condition" ALTER COLUMN "status" TYPE "ConditionStatus_new" USING ("status"::text::"ConditionStatus_new");
ALTER TYPE "ConditionStatus" RENAME TO "ConditionStatus_old";
ALTER TYPE "ConditionStatus_new" RENAME TO "ConditionStatus";
DROP TYPE "ConditionStatus_old";
ALTER TABLE "Condition" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LoanStatus_new" AS ENUM ('LEAD', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'CLEAR_TO_CLOSE', 'FUNDED', 'DEAD');
ALTER TABLE "Loan" ALTER COLUMN "status" TYPE "LoanStatus_new" USING ("status"::text::"LoanStatus_new");
ALTER TYPE "LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "LoanStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Borrower" ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "ssn" TEXT;

-- AlterTable
ALTER TABLE "Condition" ADD COLUMN     "description" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "amount",
DROP COLUMN "borrower",
DROP COLUMN "borrowerEmail",
DROP COLUMN "borrowerFirstName",
DROP COLUMN "borrowerLastName",
DROP COLUMN "borrowerMiddleName",
DROP COLUMN "borrowerPhone",
DROP COLUMN "estimatedValue",
DROP COLUMN "property",
DROP COLUMN "propertyAddress",
ADD COLUMN     "borrowerUserId" TEXT,
ADD COLUMN     "dscrRatio" DOUBLE PRECISION,
ADD COLUMN     "monthlyRent" DOUBLE PRECISION,
ADD COLUMN     "otherExpenses" DOUBLE PRECISION,
ADD COLUMN     "vacancyPercent" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "conditionId" TEXT,
    "type" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "conditionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "autoAssign" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanContact" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "entities" TEXT[],
    "properties" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanInvite" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "companyId" TEXT,
    "status" "LoanInviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "LoanInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskReminderSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "ReminderFrequency" NOT NULL DEFAULT 'DAILY',
    "recipientUserIds" TEXT[],
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskReminderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "borrowerEmail" TEXT NOT NULL,
    "borrowerUserId" TEXT,
    "brokerId" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyCity" TEXT NOT NULL,
    "propertyState" TEXT NOT NULL,
    "propertyZip" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteOption" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "loanType" "LoanType" NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "points" DOUBLE PRECISION,
    "estimatedPayment" DOUBLE PRECISION NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanContact_loanId_companyType_key" ON "LoanContact"("loanId", "companyType");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowerProfile_userId_key" ON "BorrowerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanInvite_token_key" ON "LoanInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TaskReminderSetting_userId_key" ON "TaskReminderSetting"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_borrowerUserId_fkey" FOREIGN KEY ("borrowerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContact" ADD CONSTRAINT "LoanContact_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanContact" ADD CONSTRAINT "LoanContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowerProfile" ADD CONSTRAINT "BorrowerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInvite" ADD CONSTRAINT "LoanInvite_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInvite" ADD CONSTRAINT "LoanInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInvite" ADD CONSTRAINT "LoanInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReminderSetting" ADD CONSTRAINT "TaskReminderSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_borrowerUserId_fkey" FOREIGN KEY ("borrowerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteOption" ADD CONSTRAINT "QuoteOption_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
