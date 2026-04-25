import { Injectable, Logger } from '@nestjs/common';
export interface OutboxQueueItem {
  integrationId: number;
  data: unknown;
  processDate: Date;
}

@Injectable()
export class OutboxQueueService {
  private readonly logger = new Logger(OutboxQueueService.name);
  private readonly queue: OutboxQueueItem[] = [];

  enqueue(item: OutboxQueueItem): void {
    this.queue.push(item);
    this.logger.log(
      `OUTBOX_QUEUE enqueue (integrationId=${item.integrationId}, queueSize=${this.queue.length})`,
    );
  }

  drain(): OutboxQueueItem[] {
    if (this.queue.length === 0) {
      return [];
    }

    return this.queue.splice(0, this.queue.length);
  }
}
