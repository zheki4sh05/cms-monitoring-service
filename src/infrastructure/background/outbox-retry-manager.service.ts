import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresMonitoringRetryRepository } from '../persistence/postgres-monitoring-retry.repository.js';
import { OutboxProcessingService } from './outbox-processing.service.js';

@Injectable()
export class OutboxRetryManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRetryManagerService.name);
  private readonly processIntervalMs: number;
  private intervalRef: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringRetryRepository: PostgresMonitoringRetryRepository,
    private readonly outboxProcessingService: OutboxProcessingService,
  ) {
    this.processIntervalMs = Number(this.configService.get<string>('OUTBOX_RETRY_INTERVAL_MS', '1800000'));
  }

  onModuleInit(): void {
    this.logger.log(`Outbox retry manager started. Processing interval=${this.processIntervalMs}ms`);
    this.intervalRef = setInterval(() => {
      void this.processRetryQueue();
    }, this.processIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('Outbox retry manager scheduler stopped');
    }
  }

  private async processRetryQueue(): Promise<void> {
    if (this.processing) {
      this.logger.warn('OUTBOX_RETRY processing is already running, skipping current tick');
      return;
    }

    this.processing = true;
    try {
      const batch = await this.monitoringRetryRepository.listPending(500);
      if (batch.length === 0) {
        this.logger.log('OUTBOX_RETRY is empty');
        return;
      }

      this.logger.log(`OUTBOX_RETRY processing batch size=${batch.length}`);
      for (const item of batch) {
        await this.outboxProcessingService.processRetryItem(
          item.id,
          item.integrationId,
          item.data,
          item.processDate,
        );
      }
    } finally {
      this.processing = false;
    }
  }
}
