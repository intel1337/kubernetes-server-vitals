import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { Param } from '@nestjs/common';
@Controller('hc')
export class HealthCheckController {
    constructor(private healthCheckService: HealthCheckService) {} 
    

    @Get('target/:serverId')
    getTargetHealth(@Param('serverId') serverId: string) {
        return this.healthCheckService.getTargetHealth(serverId);
  }

  @Get('all')
  getAllTargetsHealth(){
    return this.healthCheckService.getAllTargetsHealth();

  }
}
