/*
  Warnings:

  - You are about to drop the column `intent_status` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "intent_status",
ADD COLUMN     "checkout_session_status" "IntentStatus" NOT NULL DEFAULT 'OPEN';
