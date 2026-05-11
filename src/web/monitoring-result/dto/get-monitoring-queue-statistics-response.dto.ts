import { ApiProperty } from '@nestjs/swagger';

export class MonitoringQueueStatRowDto {
  @ApiProperty({ example: 'dacd1e4a-216e-47fd-ad6f-a719f2f42863' })
  id!: string;

  @ApiProperty({ example: 'ro-internal-id-1' })
  riskObjectId!: string;

  @ApiProperty({ example: 'ООО «Вектор»' })
  riskObjectName!: string;

  @ApiProperty({ example: '2026-04-12T10:15:00.000Z' })
  processDate!: string;
}

export class GetMonitoringQueueStatisticsResponseDto {
  @ApiProperty({ type: () => [MonitoringQueueStatRowDto] })
  results!: MonitoringQueueStatRowDto[];

  @ApiProperty({ type: () => [MonitoringQueueStatRowDto] })
  retries!: MonitoringQueueStatRowDto[];
}
