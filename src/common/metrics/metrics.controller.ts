import { Controller, Get, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { register } from 'prom-client';
import { Response } from 'express';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', register.contentType)
  @ApiOperation({ summary: 'Get application metrics' })
  async getMetrics(@Res() response: Response) {
    const metrics = await register.metrics();
    response.send(metrics);
  }
}
