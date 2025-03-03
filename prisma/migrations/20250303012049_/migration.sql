/*
  Warnings:

  - A unique constraint covering the columns `[cuid]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "payment_method_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_cuid_key" ON "Payment"("cuid");
