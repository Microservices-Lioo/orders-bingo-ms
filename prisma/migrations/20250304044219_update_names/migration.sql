/*
  Warnings:

  - You are about to drop the column `checkout_session_status` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `checkoutSessionId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "checkout_session_status",
DROP COLUMN "paymentIntentId",
DROP COLUMN "payment_method_id",
DROP COLUMN "payment_status",
ADD COLUMN     "checkoutSessionId" TEXT NOT NULL,
ADD COLUMN     "checkoutSessionStatus" "CheckoutSS" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
