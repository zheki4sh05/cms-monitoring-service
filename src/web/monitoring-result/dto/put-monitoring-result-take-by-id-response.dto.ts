import { ApiProperty } from '@nestjs/swagger';

export class PutMonitoringResultTakeByIdResponseDto {
  @ApiProperty({ example: 10 })
  integrationId!: number;

  @ApiProperty({ example: 'ro-9f35cfa2' })
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
