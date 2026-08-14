import { BadGatewayException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHealthReportInput, DecoyHealthResponse } from './types/report.type';

@Injectable()
export class HealthCheckService {
    private readonly authList = ['decoy-a', 'decoy-b', 'decoy-c'];
    constructor(private prisma: PrismaService) { }

    // health proxy
    async getTargetHealth(serverId: string) {
        if (!this.authList.includes(serverId)) {
            throw new ForbiddenException('Server is not authorized for health checks');
        }
        const isProd = process.env.PROD === '1';
        const target = isProd
            ? `http://${serverId}:3000/health`
            : `http://localhost:${3000 + this.authList.indexOf(serverId)}/health`;

        const start = Date.now();
        const res = await fetch(target);
        const elapsed = Date.now() - start;

        if (!res.ok) {
            const finalReport: CreateHealthReportInput = {
                status: 'error',
                service: serverId,
                timestamp: new Date(start),
                uptime: 0,
                elapsed,
                httpStatus: res.status,
                detail: `HTTP ${res.status}`,
            };
            await this.prisma.healthReport.create({ data: finalReport });
            throw new BadGatewayException(finalReport);
        }

        const data = (await res.json()) as DecoyHealthResponse;

        const finalReport: CreateHealthReportInput = {
            status: data.status,
            service: data.service,
            timestamp: new Date(data.timestamp),
            uptime: data.uptime,
            elapsed,
            detail: `Health check successful for ${serverId}`,
            httpStatus: res.status,
        };

        await this.prisma.healthReport.create({ data: finalReport });

        return finalReport;
    }

    // all servers health proxy
    async getAllTargetsHealth() {
        const isProd = process.env.PROD === '1';

        const results = await Promise.all(
            this.authList.map(async (element, index) => {
                const target = isProd
                    ? `http://${element}:3000/health`
                    : `http://localhost:${3000 + index}/health`;

                const start = Date.now();
                try {
                    const res = await fetch(target);
                    const elapsed = Date.now() - start;

                    if (!res.ok) {
                        const finalReport: CreateHealthReportInput = {
                            status: 'error',
                            service: element,
                            timestamp: new Date(start),
                            uptime: 0,
                            elapsed,
                            httpStatus: res.status,
                            detail: `HTTP ${res.status}`,
                        };
                        await this.prisma.healthReport.create({ data: finalReport });
                        return finalReport;
                    }

                    const data = (await res.json()) as DecoyHealthResponse;

                    const finalReport: CreateHealthReportInput = {
                        status: data.status,
                        service: data.service,
                        timestamp: new Date(data.timestamp),
                        uptime: data.uptime,
                        elapsed,
                        detail: `Health check successful for ${element}`,
                        httpStatus: res.status,
                    };
                    await this.prisma.healthReport.create({ data: finalReport });

                    return finalReport;
                } catch (err) {
                    const elapsed = Date.now() - start;
                    const finalReport: CreateHealthReportInput = {
                        status: 'unreachable',
                        service: element,
                        timestamp: new Date(start),
                        uptime: 0,
                        elapsed,
                        httpStatus: null,
                        detail: err instanceof Error ? err.message : String(err),
                    };
                    await this.prisma.healthReport.create({ data: finalReport });
                    return finalReport;
                }
            })
        );

        return results;
    }
}
