/*
  Warnings:

  - You are about to drop the column `notification_dispatchId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_orderId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_productId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_rewardId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_teamId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_truckId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_wasteAnalysisId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_dispatchId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_orderId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_productId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_rewardId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_teamId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_truckId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_wasteAnalysisId_fkey";

-- DropIndex
DROP INDEX "notifications_notification_dispatchId_idx";

-- DropIndex
DROP INDEX "notifications_notification_orderId_idx";

-- DropIndex
DROP INDEX "notifications_notification_rewardId_idx";

-- DropIndex
DROP INDEX "notifications_notification_wasteAnalysisId_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "notification_dispatchId",
DROP COLUMN "notification_orderId",
DROP COLUMN "notification_productId",
DROP COLUMN "notification_rewardId",
DROP COLUMN "notification_teamId",
DROP COLUMN "notification_truckId",
DROP COLUMN "notification_wasteAnalysisId",
ADD COLUMN     "notification_entityId" TEXT,
ADD COLUMN     "notification_entityType" TEXT;

-- CreateIndex
CREATE INDEX "notifications_notification_entityType_notification_entityId_idx" ON "notifications"("notification_entityType", "notification_entityId");
