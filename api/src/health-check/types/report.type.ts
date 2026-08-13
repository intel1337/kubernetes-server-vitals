
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