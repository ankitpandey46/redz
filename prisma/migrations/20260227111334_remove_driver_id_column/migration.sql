/*
  Warnings:

  - You are about to drop the column `driverId` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `driveruserid` on the `DriverOnline` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[driverId]` on the table `DriverOnline` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `driverId` to the `DriverOnline` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DriverOnline" DROP CONSTRAINT "DriverOnline_driveruserid_fkey";

-- DropIndex
DROP INDEX "Driver_driverId_key";

-- DropIndex
DROP INDEX "DriverOnline_driveruserid_key";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "driverId";

-- AlterTable
ALTER TABLE "DriverOnline" DROP COLUMN "driveruserid",
ADD COLUMN     "driverId" INTEGER NOT NULL,
ALTER COLUMN "driverstatus" DROP DEFAULT,
ALTER COLUMN "driverstatus" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DriverOnline_driverId_key" ON "DriverOnline"("driverId");

-- AddForeignKey
ALTER TABLE "DriverOnline" ADD CONSTRAINT "DriverOnline_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
