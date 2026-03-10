/*
  Warnings:

  - The `status` column on the `Condition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Condition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Condition" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConditionStatus" NOT NULL DEFAULT 'OPEN';
