-- CreateTable
CREATE TABLE "DriverOTP" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverOTP_phoneNumber_idx" ON "DriverOTP"("phoneNumber");
