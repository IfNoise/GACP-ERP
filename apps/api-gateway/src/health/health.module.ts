import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';

@Controller({ path: 'health', version: '1' })
class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
