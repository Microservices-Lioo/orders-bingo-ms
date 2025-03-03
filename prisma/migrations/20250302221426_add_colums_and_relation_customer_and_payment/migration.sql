/*
  Warnings:

  - You are about to drop the column `stripe` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `stripeId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalItems` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "stripe",
ADD COLUMN     "stripeId" TEXT NOT NULL,
ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "Customer_id_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "totalItems" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
