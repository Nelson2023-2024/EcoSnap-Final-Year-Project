-- CreateEnum
CREATE TYPE "dispatch_status" AS ENUM ('pending', 'assigned', 'en_route', 'collected', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('login', 'waste_report', 'reward_earned', 'bonus_awarded', 'cleanup_verified', 'dispatch_assigned', 'dispatch_update', 'truck_status', 'team_update', 'system');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "related_model" AS ENUM ('User', 'WasteAnalysis', 'Dispatch', 'Reward', 'Truck', 'Team');

-- CreateEnum
CREATE TYPE "reward_reason" AS ENUM ('waste_report', 'cleanup_verified', 'bonus', 'redemption');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "dispatches" (
    "dispatch_id" TEXT NOT NULL,
    "dispatch_wasteAnalysisId" TEXT NOT NULL,
    "dispatch_assignedTeamId" TEXT NOT NULL,
    "dispatch_assignedTruckId" TEXT NOT NULL,
    "dispatch_locationLongitude" DOUBLE PRECISION NOT NULL,
    "dispatch_locationLatitude" DOUBLE PRECISION NOT NULL,
    "dispatch_locationAddress" TEXT,
    "dispatch_status" "dispatch_status" NOT NULL DEFAULT 'assigned',
    "dispatch_scheduledDate" TIMESTAMP(3) NOT NULL,
    "dispatch_estimatedArrival" TIMESTAMP(3),
    "dispatch_actualCollectionDate" TIMESTAMP(3),
    "dispatch_collectionVerified" BOOLEAN NOT NULL DEFAULT false,
    "dispatch_collectionNotes" TEXT,
    "dispatch_pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "dispatch_priority" "Priority" NOT NULL DEFAULT 'normal',
    "dispatch_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatch_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("dispatch_id")
);

-- CreateTable
CREATE TABLE "dispatch_images" (
    "id" TEXT NOT NULL,
    "imageURL" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,

    CONSTRAINT "dispatch_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "notification_userId" TEXT NOT NULL,
    "notification_type" "notification_type" NOT NULL DEFAULT 'system',
    "notification_title" TEXT NOT NULL,
    "notification_message" TEXT NOT NULL,
    "notification_isRead" BOOLEAN NOT NULL DEFAULT false,
    "notification_metadata" JSONB,
    "notification_relatedModel" "related_model",
    "notification_relatedId" TEXT,
    "notification_priority" "Priority" NOT NULL DEFAULT 'normal',
    "notification_status" "notification_status" NOT NULL DEFAULT 'active',
    "notification_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notification_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "reward_id" TEXT NOT NULL,
    "reward_userId" TEXT NOT NULL,
    "reward_wasteAnalysisId" TEXT,
    "reward_pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "reward_reason" "reward_reason" NOT NULL DEFAULT 'waste_report',
    "reward_transactionType" "transaction_type" NOT NULL DEFAULT 'credit',
    "reward_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reward_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("reward_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_description" TEXT,
    "product_imageURL" TEXT NOT NULL,
    "product_pointsCost" INTEGER NOT NULL,
    "product_stock" INTEGER NOT NULL DEFAULT 0,
    "product_isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "product_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" TEXT NOT NULL,
    "order_userId" TEXT NOT NULL,
    "order_productId" TEXT NOT NULL,
    "order_quantity" INTEGER NOT NULL DEFAULT 1,
    "order_totalCost" INTEGER NOT NULL,
    "order_status" "order_status" NOT NULL DEFAULT 'pending',
    "order_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_dispatch_wasteAnalysisId_key" ON "dispatches"("dispatch_wasteAnalysisId");

-- CreateIndex
CREATE INDEX "notifications_notification_userId_notification_isRead_notif_idx" ON "notifications"("notification_userId", "notification_isRead", "notification_createdAt");

-- CreateIndex
CREATE INDEX "notifications_notification_type_notification_status_idx" ON "notifications"("notification_type", "notification_status");

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_dispatch_wasteAnalysisId_fkey" FOREIGN KEY ("dispatch_wasteAnalysisId") REFERENCES "waste_analysis"("waste_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_dispatch_assignedTeamId_fkey" FOREIGN KEY ("dispatch_assignedTeamId") REFERENCES "teams"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_dispatch_assignedTruckId_fkey" FOREIGN KEY ("dispatch_assignedTruckId") REFERENCES "trucks"("truck_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_images" ADD CONSTRAINT "dispatch_images_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "dispatches"("dispatch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_userId_fkey" FOREIGN KEY ("notification_userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_reward_userId_fkey" FOREIGN KEY ("reward_userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_userId_fkey" FOREIGN KEY ("order_userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_productId_fkey" FOREIGN KEY ("order_productId") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
