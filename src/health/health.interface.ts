import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckInfo {
  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  details?: Record<string, any>;
}

export class HealthCheckDetails {
  @ApiProperty({ type: HealthCheckInfo })
  database?: HealthCheckInfo;

  @ApiProperty({ type: HealthCheckInfo })
  redis?: HealthCheckInfo;

  @ApiProperty({ type: HealthCheckInfo })
  cron?: HealthCheckInfo;

  @ApiProperty({ type: HealthCheckInfo })
  storage?: HealthCheckInfo;

  @ApiProperty({ type: HealthCheckInfo })
  memory_heap?: HealthCheckInfo;

  @ApiProperty({ type: HealthCheckInfo })
  memory_rss?: HealthCheckInfo;
}

export class HealthCheckResult {
  @ApiProperty({ enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ type: HealthCheckDetails, required: false })
  info?: Partial<HealthCheckDetails>;

  @ApiProperty({ type: HealthCheckDetails, required: false })
  error?: Partial<HealthCheckDetails>;

  @ApiProperty({ type: HealthCheckDetails })
  details: HealthCheckDetails;
}
