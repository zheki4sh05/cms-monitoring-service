import { ApiProperty } from '@nestjs/swagger';

export class PutMonitoringResultTakeByIdResponseDto {
  @ApiProperty({ example: 10 })
  integrationId!: number;

  @ApiProperty({ example: '9d2e8ee8-f8ae-4de0-8b6b-09e9e35f3958' })
  riskobjectId!: string;

  @ApiProperty({
    example: {
      metric: 'latency',
      value: 131,
    },
  })
  data!: unknown;

  @ApiProperty({
    example: [
      { from: 'value', to: 'payload.latency' },
      { from: 'metric', to: 'payload.metricName' },
    ],
  })
  mappingRules!: unknown;
}
