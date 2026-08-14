-- CreateTable
CREATE TABLE "Telemetry" (
    "id" SERIAL NOT NULL,
    "service" TEXT NOT NULL,
    "cpuPercent" DOUBLE PRECISION,
    "memoryUsedMb" DOUBLE PRECISION,
    "memoryTotalMb" DOUBLE PRECISION,
    "diskUsedMb" DOUBLE PRECISION,
    "diskTotalMb" DOUBLE PRECISION,
    "heapUsedMb" DOUBLE PRECISION,
    "heapTotalMb" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Telemetry_service_recordedAt_idx" ON "Telemetry"("service", "recordedAt");
