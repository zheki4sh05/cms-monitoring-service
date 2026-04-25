import { Injectable, Logger } from '@nestjs/common';
import type { PullConfig } from '../../core/integration/domain/integration-config.js';

export interface OutboxQueueItem {
  companyId: string;
  integrationId: number;
  integrationName: string;
  pullConfig: PullConfig | null;
  requestConfig: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };
  createdAt: Date;
}

@Injectable()
export class OutboxQueueService {
  private readonly logger = new Logger(OutboxQueueService.name);
  private readonly queue: OutboxQueueItem[] = [];

  enqueue(item: OutboxQueueItem): void {
    this.queue.push(item);
    this.logger.log(
      `OUTBOX_QUEUE enqueue (companyId=${item.companyId}, integrationId=${item.integrationId}, queueSize=${this.queue.length})`,
    );
  }

  drain(): OutboxQueueItem[] {
    if (this.queue.length === 0) {
      return [];
    }

    return this.queue.splice(0, this.queue.length);
  }
}
