/*
  Warnings:

  - You are about to drop the column `notification_relatedId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notification_relatedModel` on the `notifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "notification_relatedId",
DROP COLUMN "notification_relatedModel",
ADD COLUMN     "notification_dispatchId" TEXT,
ADD COLUMN     "notification_rewardId" TEXT,
ADD COLUMN     "notification_teamId" TEXT,
ADD COLUMN     "notification_truckId" TEXT,
ADD COLUMN     "notification_wasteAnalysisId" TEXT;

-- DropEnum
DROP TYPE "related_model";

-- CreateIndex
CREATE INDEX "notifications_notification_wasteAnalysisId_idx" ON "notifications"("notification_wasteAnalysisId");

-- CreateIndex
CREATE INDEX "notifications_notification_dispatchId_idx" ON "notifications"("notification_dispatchId");

-- CreateIndex
CREATE INDEX "notifications_notification_rewardId_idx" ON "notifications"("notification_rewardId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_wasteAnalysisId_fkey" FOREIGN KEY ("notification_wasteAnalysisId") REFERENCES "waste_analysis"("waste_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_dispatchId_fkey" FOREIGN KEY ("notification_dispatchId") REFERENCES "dispatches"("dispatch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_rewardId_fkey" FOREIGN KEY ("notification_rewardId") REFERENCES "rewards"("reward_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_truckId_fkey" FOREIGN KEY ("notification_truckId") REFERENCES "trucks"("truck_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_teamId_fkey" FOREIGN KEY ("notification_teamId") REFERENCES "teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
