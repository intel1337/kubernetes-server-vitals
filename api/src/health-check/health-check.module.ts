import { Module } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { HealthCheckController } from './health-check.controller';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({

  providers: [HealthCheckService, PrismaService],
  controllers: [HealthCheckController]
})
export class HealthCheckModule {}
