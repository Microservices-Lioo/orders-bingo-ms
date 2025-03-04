/*
  Warnings:

  - The `checkout_session_status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CheckoutSS" AS ENUM ('OPEN', 'COMPLETE', 'EXPIRED');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "checkout_session_status",
ADD COLUMN     "checkout_session_status" "CheckoutSS" NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "IntentStatus";
