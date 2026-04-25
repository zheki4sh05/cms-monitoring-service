import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { OutboxQueueService } from './outbox-queue.service.js';
import { OutboxProcessingService } from './outbox-processing.service.js';

@Injectable()
export class OutboxManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxManagerService.name);
  private readonly processIntervalMs = 1 * 60 * 1000;
  private intervalRef: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly outboxQueueService: OutboxQueueService,
    private readonly outboxProcessingService: OutboxProcessingService,
  ) {}

  onModuleInit(): void {
    this.logger.log(`Outbox manager started. Processing interval=${this.processIntervalMs}ms`);
    this.intervalRef = setInterval(() => {
      void this.processQueue();
    }, this.processIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
      this.logger.log('Outbox manager scheduler stopped');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      this.logger.warn('OUTBOX_QUEUE processing is already running, skipping current tick');
      return;
    }

    this.processing = true;
    const batch = this.outboxQueueService.drain();
    if (batch.length === 0) {
      this.logger.log('OUTBOX_QUEUE is empty');
      this.processing = false;
      return;
    }

    try {
      this.logger.log(`OUTBOX_QUEUE processing batch size=${batch.length}`);
      for (const item of batch) {
        await this.outboxProcessingService.processFreshItem(item.integrationId, item.data, item.processDate);
      }
    } finally {
      this.processing = false;
    }
  }
}
