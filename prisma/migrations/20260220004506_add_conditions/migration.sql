/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Condition` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Condition` table. All the data in the column will be lost.
  - The `status` column on the `Condition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `title` to the `Condition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Condition" DROP COLUMN "assignedTo",
DROP COLUMN "dueDate",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
