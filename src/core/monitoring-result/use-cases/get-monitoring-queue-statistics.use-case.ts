import { Injectable } from '@nestjs/common';
import { PostgresMonitoringResultRepository } from '../../../infrastructure/persistence/postgres-monitoring-result.repository.js';
import { PostgresMonitoringRetryRepository } from '../../../infrastructure/persistence/postgres-monitoring-retry.repository.js';

export interface MonitoringQueueStatRow {
  id: string;
  riskObjectId: string;
  riskObjectName: string;
  processDate: Date;
}

export interface GetMonitoringQueueStatisticsOutput {
  results: MonitoringQueueStatRow[];
  retries: MonitoringQueueStatRow[];
}

export interface GetMonitoringQueueStatisticsInput {
  companyId: string;
}

@Injectable()
export class GetMonitoringQueueStatisticsUseCase {
  constructor(
    private readonly monitoringResultRepository: PostgresMonitoringResultRepository,
    private readonly monitoringRetryRepository: PostgresMonitoringRetryRepository,
  ) {}

  async execute(input: GetMonitoringQueueStatisticsInput): Promise<GetMonitoringQueueStatisticsOutput> {
    const { companyId } = input;
    const [results, retries] = await Promise.all([
      this.monitoringResultRepository.listStatisticsRows(companyId),
      this.monitoringRetryRepository.listStatisticsRows(companyId),
    ]);

    return { results, retries };
  }
}
