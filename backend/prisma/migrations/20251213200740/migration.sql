/*
  Warnings:

  - You are about to drop the column `notification_dispatchId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_rewardId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_teamId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_truckId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_wasteAnalysisId` on the `notifications` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "related_model" AS ENUM ('User', 'WasteAnalysis', 'Dispatch', 'Reward', 'Truck', 'Team');

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_notification_dispatchId_fkey";

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
DROP INDEX "notifications_notification_rewardId_idx";

-- DropIndex
DROP INDEX "notifications_notification_wasteAnalysisId_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "notification_dispatchId",
DROP COLUMN "notification_rewardId",
DROP COLUMN "notification_teamId",
DROP COLUMN "notification_truckId",
DROP COLUMN "notification_wasteAnalysisId",
ADD COLUMN     "notification_relatedId" TEXT,
ADD COLUMN     "notification_relatedModel" "related_model";
