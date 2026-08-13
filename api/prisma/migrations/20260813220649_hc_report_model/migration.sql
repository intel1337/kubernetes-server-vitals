-- CreateTable
CREATE TABLE "HealthReport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "uptime" DOUBLE PRECISION NOT NULL,
    "elapsed" INTEGER NOT NULL,

    CONSTRAINT "HealthReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthReport_service_createdAt_idx" ON "HealthReport"("service", "createdAt");
