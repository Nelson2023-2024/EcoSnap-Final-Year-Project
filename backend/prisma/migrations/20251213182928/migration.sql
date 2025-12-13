-- CreateEnum
CREATE TYPE "waste_overall_category" AS ENUM ('general', 'recyclables', 'e_waste', 'organic', 'hazardous');

-- CreateEnum
CREATE TYPE "volume_unit" AS ENUM ('kg', 'liters', 'cubic_meters');

-- CreateEnum
CREATE TYPE "waste_status" AS ENUM ('pending_dispatch', 'dispatched', 'collected', 'no_waste', 'error');

-- CreateTable
CREATE TABLE "waste_analysis" (
    "waste_id" TEXT NOT NULL,
    "waste_analysedBy" TEXT NOT NULL,
    "waste_imageURL" TEXT NOT NULL,
    "waste_containsWaste" BOOLEAN NOT NULL DEFAULT true,
    "waste_overallCategory" "waste_overall_category",
    "waste_dominantWasteType" TEXT,
    "waste_estimatedVolumeValue" DOUBLE PRECISION,
    "waste_estimatedVolumeUnit" "volume_unit",
    "waste_possibleSource" TEXT,
    "waste_environmentalImpact" TEXT,
    "waste_confidenceLevel" TEXT,
    "waste_status" "waste_status" NOT NULL DEFAULT 'pending_dispatch',
    "waste_errorMessage" TEXT,
    "waste_locationLongitude" DOUBLE PRECISION NOT NULL,
    "waste_locationLatitude" DOUBLE PRECISION NOT NULL,
    "waste_locationAddress" TEXT,
    "waste_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waste_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_analysis_pkey" PRIMARY KEY ("waste_id")
);

-- CreateTable
CREATE TABLE "waste_categories" (
    "id" TEXT NOT NULL,
    "waste_type" TEXT NOT NULL,
    "waste_estimatedPercentage" DOUBLE PRECISION NOT NULL,
    "wasteAnalysisId" TEXT NOT NULL,

    CONSTRAINT "waste_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "waste_analysis" ADD CONSTRAINT "waste_analysis_waste_analysedBy_fkey" FOREIGN KEY ("waste_analysedBy") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_categories" ADD CONSTRAINT "waste_categories_wasteAnalysisId_fkey" FOREIGN KEY ("wasteAnalysisId") REFERENCES "waste_analysis"("waste_id") ON DELETE CASCADE ON UPDATE CASCADE;
