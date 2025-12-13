-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'collector');

-- CreateEnum
CREATE TYPE "team_specialization" AS ENUM ('general', 'recyclables', 'e_waste', 'organic', 'hazardous');

-- CreateEnum
CREATE TYPE "team_status" AS ENUM ('active', 'off_duty');

-- CreateEnum
CREATE TYPE "truck_type" AS ENUM ('general', 'recyclables', 'e_waste', 'organic', 'hazardous');

-- CreateEnum
CREATE TYPE "truck_status" AS ENUM ('available', 'in_use', 'maintenance');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "user_firstName" TEXT,
    "user_lastName" TEXT,
    "user_fullName" TEXT,
    "user_email" TEXT NOT NULL,
    "user_username" TEXT NOT NULL,
    "user_phoneNumber" TEXT,
    "user_password" TEXT,
    "user_profileImage" TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    "user_points" INTEGER NOT NULL DEFAULT 0,
    "user_googleID" TEXT,
    "user_authProvider" TEXT,
    "user_role" "UserRole" NOT NULL DEFAULT 'user',
    "user_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "teams" (
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "team_url" TEXT,
    "team_specialization" "team_specialization" NOT NULL DEFAULT 'general',
    "team_status" "team_status" NOT NULL DEFAULT 'active',
    "team_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trucks" (
    "truck_id" TEXT NOT NULL,
    "truck_registrationNumber" TEXT NOT NULL,
    "truck_imageURL" TEXT,
    "truck_truckType" "truck_type" NOT NULL,
    "truck_capacity" DOUBLE PRECISION NOT NULL,
    "truck_status" "truck_status" NOT NULL DEFAULT 'available',
    "truck_assignedTeamId" TEXT,
    "truck_locationLongitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "truck_locationLatitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "truck_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "truck_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trucks_pkey" PRIMARY KEY ("truck_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_username_key" ON "users"("user_username");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_googleID_key" ON "users"("user_googleID");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_teamId_key" ON "team_members"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_truck_registrationNumber_key" ON "trucks"("truck_registrationNumber");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_truck_assignedTeamId_fkey" FOREIGN KEY ("truck_assignedTeamId") REFERENCES "teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
