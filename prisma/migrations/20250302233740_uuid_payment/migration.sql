-- AlterTable
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "Payment_id_key";
