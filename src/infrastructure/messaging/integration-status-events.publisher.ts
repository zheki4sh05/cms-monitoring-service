import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Producer } from 'kafkajs';
import type { IntegrationRuntimeStatus } from '../../core/integration/domain/integration-config.js';

interface IntegrationStatusEventPayload {
  userId: string;
  companyId: string;
  valueType: 'text';
  moduleType: 'integration_status';
  clientType: 'admin';
  data: {
    status: IntegrationRuntimeStatus;
  };
}

@Injectable()
export class IntegrationStatusEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationStatusEventsPublisher.name);
  private readonly topic: string;
  private readonly fallbackUserId: string;
  private readonly kafkaBrokers: string[];
  private producer: Producer | null = null;
  private connected = false;

  constructor(private readonly configService: ConfigService) {
    this.topic = this.configService.get<string>('KAFKA_WS_EVENTS_TOPIC', 'ws_events');
    this.fallbackUserId = this.configService.get<string>('KAFKA_WS_EVENTS_USER_ID', 'integration-manager');
    this.kafkaBrokers = this.parseCsv(this.configService.get<string>('KAFKA_BROKERS'));
  }

  async onModuleInit(): Promise<void> {
    if (!this.kafkaBrokers.length) {
      this.logger.warn('Kafka brokers are not configured. Status events publishing is disabled.');
      return;
    }

    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID', 'cms-monitoring-service');
    this.logger.log(`Initializing Kafka producer (clientId=${clientId}, brokers=${this.kafkaBrokers.join(',')})`);
    const kafka = new Kafka({
      clientId,
      brokers: this.kafkaBrokers,
    });

    this.producer = kafka.producer();
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log(`Kafka producer connected successfully (topic=${this.topic})`);
    } catch (error) {
      this.logger.error(
        `Kafka producer connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.producer || !this.connected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(
        `Kafka producer disconnect failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.connected = false;
    }
  }

  async publishStatusChanged(
    companyId: string,
    status: IntegrationRuntimeStatus,
    userId?: string,
  ): Promise<void> {
    if (!this.connected || !this.producer) {
      this.logger.warn(
        `Kafka producer is not connected, skipping integration status event (companyId=${companyId}, status=${status})`,
      );
      return;
    }

    const message: IntegrationStatusEventPayload = {
      userId: userId?.trim() || this.fallbackUserId,
      companyId,
      valueType: 'text',
      moduleType: 'integration_status',
      clientType: 'admin',
      data: {
        status,
      },
    };

    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: companyId,
            value: JSON.stringify(message),
          },
        ],
      });
      this.logger.log(
        `Kafka integration status event published (topic=${this.topic}, companyId=${companyId}, status=${status})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish integration status event (companyId=${companyId}, status=${status}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private parseCsv(value?: string): string[] {
    if (!value?.trim()) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
