
export type HealthReport = {
    id: number;
    createdAt: Date;
    status: string;
    httpStatus: number | null;
    service: string;
    timestamp: Date;
    uptime: number;
    elapsed: number;
    detail: string | null;
};


export type CreateHealthReportInput = {
    status: string;
    httpStatus?: number | null;
    service: string;
    timestamp: Date;
    uptime: number;
    elapsed: number;
    detail?: string | null;
};

export type DecoyHealthResponse = {
    status: string;
    service: string;
    timestamp: string;
    uptime: number;
};

export type TelemetryReport = {
    id: number;
    recordedAt: Date;
    service: string;
    cpuPercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    diskUsedMb: number;
    diskTotalMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
};

export type TelemetryResponse = {
    service: string;
    cpuPercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    diskUsedMb: number;
    diskTotalMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
};


export type CreateTelemetryReport = {
    service: string;
    cpuPercent: number | null;
    memoryUsedMb: number | null;
    memoryTotalMb: number | null;
    diskUsedMb: number | null;
    diskTotalMb: number | null;
    heapUsedMb: number | null;
    heapTotalMb: number | null;
    httpStatus : number | null;
};