-- AlterEnum
ALTER TYPE "CompanyType" ADD VALUE 'OTHER';

-- AlterTable: Add role to Contact
ALTER TABLE "Contact" ADD COLUMN "role" TEXT;

-- AlterTable: Add role to LoanContact, change unique constraint
ALTER TABLE "LoanContact" ADD COLUMN "role" TEXT;

-- Drop old unique constraint (loanId, companyType)
ALTER TABLE "LoanContact" DROP CONSTRAINT IF EXISTS "LoanContact_loanId_companyType_key";

-- Add new unique constraint (loanId, contactId)
ALTER TABLE "LoanContact" ADD CONSTRAINT "LoanContact_loanId_contactId_key" UNIQUE ("loanId", "contactId");
