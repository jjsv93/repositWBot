-- AlterTable: Add processorId to Loan
ALTER TABLE "Loan" ADD COLUMN "processorId" TEXT;

-- AlterTable: Add reminder to Task  
ALTER TABLE "Task" ADD COLUMN "reminder" "ReminderFrequency";

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
