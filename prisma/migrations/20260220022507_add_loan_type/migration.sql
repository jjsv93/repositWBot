-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('DSCR', 'BRIDGE');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "loanType" "LoanType" NOT NULL DEFAULT 'DSCR';
