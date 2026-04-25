import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { OutboxQueueService } from './outbox-queue.service.js';

@Injectable()
export class OutboxManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxManagerService.name);
  private readonly processIntervalMs = 1 * 60 * 1000;
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(private readonly outboxQueueService: OutboxQueueService) {}

  onModuleInit(): void {
    this.logger.log(`Outbox manager started. Processing interval=${this.processIntervalMs}ms`);
    this.intervalRef = setInterval(() => {
      this.processQueue();
    }, this.processIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('Outbox manager scheduler stopped');
    }
  }

  private processQueue(): void {
    const batch = this.outboxQueueService.drain();
    if (batch.length === 0) {
      this.logger.log('OUTBOX_QUEUE is empty');
      return;
    }

    this.logger.log(`OUTBOX_QUEUE processing batch size=${batch.length}`);
    for (const item of batch) {
      this.logger.log(
        `OUTBOX_QUEUE item (companyId=${item.companyId}, integrationId=${item.integrationId}, integrationName=${item.integrationName}, method=${item.requestConfig.method}, url=${item.requestConfig.url}, pullConfig=${JSON.stringify(
          item.pullConfig,
        )}, createdAt=${item.createdAt.toISOString()})`,
      );
    }
  }
}
