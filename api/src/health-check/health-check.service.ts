import { BadGatewayException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHealthReportInput, DecoyHealthResponse } from './types/report.type';

@Injectable()
export class HealthCheckService {
    private readonly authList = ['decoy-a', 'decoy-b', 'decoy-c'];
    constructor(private prisma: PrismaService) {}

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
    if (!res.ok) {
        throw new BadGatewayException(`Health check failed for ${serverId}`);
    }

    const data = (await res.json()) as DecoyHealthResponse;
    const elapsed = Date.now() - start;
    const finalReport: CreateHealthReportInput = {
    status: data.status,
    service: data.service,
    timestamp: new Date(data.timestamp), 
    uptime: data.uptime,
    elapsed,
    };

    await this.prisma.healthReport.create({ data: finalReport });

    return { ...data, elapsed };
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
                    if (!res.ok) return { service: element, status: 'error', detail: `HTTP ${res.status}` };

                    const data = await res.json();
                    const elapsed = Date.now() - start;

                    return { ...data, elapsed };
                } catch (err) {
                    return { service: element, status: 'unreachable', detail: err };
                }
            })
        );

        return results;
    }
}
