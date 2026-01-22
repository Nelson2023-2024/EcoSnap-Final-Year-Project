-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'order_status';
ALTER TYPE "notification_type" ADD VALUE 'product_update';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "notification_orderId" TEXT,
ADD COLUMN     "notification_productId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_notification_orderId_idx" ON "notifications"("notification_orderId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_orderId_fkey" FOREIGN KEY ("notification_orderId") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_productId_fkey" FOREIGN KEY ("notification_productId") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;
