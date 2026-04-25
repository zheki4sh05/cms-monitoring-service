import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IntegrationConfigProcessManagerItem } from '../../core/integration/ports/integration-config-repository.port.js';
import { OutboxQueueService } from './outbox-queue.service.js';

@Injectable()
export class PushIntegrationBackgroundProcessService {
  private readonly logger = new Logger(PushIntegrationBackgroundProcessService.name);

  constructor(private readonly outboxQueueService: OutboxQueueService) {}

  async run(config: IntegrationConfigProcessManagerItem): Promise<void> {
    const orderExample = await this.loadOrderExample();
    const pullConfig = config.pullConfig;
    const requestConfig = {
      method: 'POST',
      url: config.endpointUrl,
      headers: {
        'content-type': 'application/json',
        'x-integration-id': String(config.id),
      },
      body: orderExample,
    };

    this.logger.log(
      `PUSH_INTEGRATION_BACKGROUND_PROCESS configured request (companyId=${config.companyId}, integrationId=${config.id}, method=${requestConfig.method}, url=${requestConfig.url}, pullConfig=${JSON.stringify(
        pullConfig,
      )})`,
    );

    this.outboxQueueService.enqueue({
      companyId: config.companyId,
      integrationId: config.id,
      integrationName: config.name,
      pullConfig,
      requestConfig,
      createdAt: new Date(),
    });
  }

  private async loadOrderExample(): Promise<unknown> {
    const filePath = join(process.cwd(), 'src', 'assets', 'order_example.json');
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as unknown;
  }
}
