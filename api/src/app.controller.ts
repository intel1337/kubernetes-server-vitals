import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private prisma: PrismaService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('readyz')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}
