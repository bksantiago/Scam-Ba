import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      engine: process.env.ANTHROPIC_API_KEY ? 'claude' : 'heuristic',
    };
  }
}
