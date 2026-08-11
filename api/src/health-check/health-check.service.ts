import { BadGatewayException, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
    private readonly authList = ['decoy-a', 'decoy-b', 'decoy-c'];

    // health proxy
    async getTargetHealth(serverId: string) {
        if (!this.authList.includes(serverId)) {
            throw new ForbiddenException('Server is not authorized for health checks');
        }
        const isProd = process.env.PROD === '1';
        const target = isProd
            ? `http://${serverId}:3000/health`
            : `http://localhost:${3000 + this.authList.indexOf(serverId)}/health`;

        const res = await fetch(target);
        if (!res.ok) {
            throw new BadGatewayException(`Health check failed for ${serverId}`);
        }

        return res.json();
    }

    // all servers health proxy
    async getAllTargetsHealth() {
        const isProd = process.env.PROD === '1';

        const results = await Promise.all(
            this.authList.map(async (element, index) => {
            const target = isProd
                ? `http://${element}:3000/health`
                : `http://localhost:${3000 + index}/health`;

            const res = await fetch(target);
            if (!res.ok) return `Health check failed for ${element}`;
            return await res.json();
            })
        );

        return results;
}
}
