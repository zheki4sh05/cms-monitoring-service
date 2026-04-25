import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Producer } from 'kafkajs';
import type { IntegrationRuntimeStatus } from '../../core/integration/domain/integration-config.js';

interface IntegrationStatusEventPayload {
  userId: string;
  companyId: string;
  entityId: string | null;
  valueType: 'text';
  moduleType: 'integration_status';
  clientType: 'admin';
  data: {
    status: IntegrationRuntimeStatus;
  };
}

interface IntegrationInvocationsEventPayload {
  userId: string;
  companyId: string;
  entityId: string | null;
  valueType: 'text';
  moduleType: 'integration_invocations';
  clientType: 'admin';
  data: {
    invocations_success: string;
    invocations_failed: string;
  };
}

interface RiskMonitoringEventPayload {
  integrationId: string;
  companyId: string;
  monitoring_entity: string;
  start_process: string;
}

interface IntegrationEventNotificationPayload {
  userId: string;
  companyId: string;
  valueType: 'text';
  entityId: null;
  moduleType: 'integration-event';
  clientType: 'admin';
  data: {
    message: string;
  };
}

@Injectable()
export class IntegrationStatusEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationStatusEventsPublisher.name);
  private readonly topic: string;
  private readonly riskTopic: string;
  private readonly fallbackUserId: string;
  private readonly kafkaBrokers: string[];
  private producer: Producer | null = null;
  private connected = false;

  constructor(private readonly configService: ConfigService) {
    this.topic = this.configService.get<string>('KAFKA_WS_EVENTS_TOPIC', 'ws_events');
    this.riskTopic = this.configService.get<string>('KAFKA_RISK_TOPIC', 'risk_topic');
    this.fallbackUserId = this.configService.get<string>('KAFKA_WS_EVENTS_USER_ID', 'integration-manager');
    this.kafkaBrokers = this.parseCsv(this.configService.get<string>('KAFKA_BROKERS'));
  }

  async publishRiskMonitoringEvent(payload: RiskMonitoringEventPayload): Promise<void> {
    if (!this.connected || !this.producer) {
      this.logger.warn(
        `Kafka producer is not connected, skipping risk monitoring event (integrationId=${payload.integrationId}, companyId=${payload.companyId})`,
      );
      return;
    }

    try {
      await this.producer.send({
        topic: this.riskTopic,
        messages: [
          {
            key: payload.companyId,
            value: JSON.stringify(payload),
          },
        ],
      });
      this.logger.log(
        `Kafka risk monitoring event published (topic=${this.riskTopic}, integrationId=${payload.integrationId}, companyId=${payload.companyId}, monitoringEntity=${payload.monitoring_entity})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish risk monitoring event (integrationId=${payload.integrationId}, companyId=${payload.companyId}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async publishDisabledRiskObjectEvent(userId: string, companyId: string, riskObjectId: string): Promise<void> {
    if (!this.connected || !this.producer) {
      this.logger.warn(
        `Kafka producer is not connected, skipping disabled risk object event (companyId=${companyId}, riskObjectId=${riskObjectId}, userId=${userId})`,
      );
      return;
    }

    const message: IntegrationEventNotificationPayload = {
      userId,
      companyId,
      valueType: 'text',
      entityId: null,
      moduleType: 'integration-event',
      clientType: 'admin',
      data: {
        message: `DISABLED_RISK_OBJECT: ${riskObjectId}`,
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
        `Kafka disabled risk object event published (topic=${this.topic}, companyId=${companyId}, riskObjectId=${riskObjectId}, userId=${userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish disabled risk object event (companyId=${companyId}, riskObjectId=${riskObjectId}, userId=${userId}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
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
    entityId: string,
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
      entityId,
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
        `Kafka integration status event published (topic=${this.topic}, companyId=${companyId}, entityId=${entityId}, status=${status})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish integration status event (companyId=${companyId}, entityId=${entityId}, status=${status}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async publishInvocationsChanged(
    companyId: string,
    entityId: string,
    invocationsSuccess: number,
    invocationsFailed: number,
    userId?: string,
  ): Promise<void> {
    if (!this.connected || !this.producer) {
      this.logger.warn(
        `Kafka producer is not connected, skipping integration invocations event (companyId=${companyId}, entityId=${entityId})`,
      );
      return;
    }

    const message: IntegrationInvocationsEventPayload = {
      userId: userId?.trim() || this.fallbackUserId,
      companyId,
      entityId,
      valueType: 'text',
      moduleType: 'integration_invocations',
      clientType: 'admin',
      data: {
        invocations_success: String(invocationsSuccess),
        invocations_failed: String(invocationsFailed),
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
        `Kafka integration invocations event published (topic=${this.topic}, companyId=${companyId}, entityId=${entityId}, invocationsSuccess=${invocationsSuccess}, invocationsFailed=${invocationsFailed})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish integration invocations event (companyId=${companyId}, entityId=${entityId}): ${error instanceof Error ? error.message : 'Unknown error'}`,
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
