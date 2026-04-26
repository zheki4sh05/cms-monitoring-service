import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

export interface CreateMonitoringResultInput {
  data: unknown;
  riskObjectId: string;
  integrationId: number;
  processDate: Date;
}

export interface MonitoringResultForProcessing {
  integrationId: number;
  riskObjectId: string;
  data: unknown;
  mappingRules: unknown;
}

@Injectable()
export class PostgresMonitoringResultRepository {
  private readonly logger = new Logger(PostgresMonitoringResultRepository.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(input: CreateMonitoringResultInput): Promise<string> {
    const generatedId = randomUUID();
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO monitoring_result (
          id,
          data,
          "riskObjectId",
          "integrationId",
          process_date
        )
        VALUES ($1::uuid, $2::jsonb, $3, $4, $5)
        RETURNING id::text AS id
      `,
      [generatedId, JSON.stringify(input.data ?? null), input.riskObjectId, input.integrationId, input.processDate],
    );

    const id = result.rows[0]?.id;
    if (!id) {
      throw new Error('Failed to persist monitoring_result: id was not returned by database.');
    }

    if (id !== generatedId) {
      this.logger.warn(`Unexpected monitoring_result id mismatch (generated=${generatedId}, returned=${id})`);
    }

    return id;
  }

  async takeForProcessingById(id: string): Promise<MonitoringResultForProcessing | null> {
    this.logger.log(`Acquiring monitoring result for processing (id=${id})`);
    const client = await this.pool.connect();

    try {
      this.logger.log(`DB transaction BEGIN for monitoring result take (id=${id})`);
      await client.query('BEGIN');
      const result = await client.query<{
        id: string;
        integrationId: number;
        riskObjectId: string;
        data: unknown;
        mappingRules: unknown;
      }>(
        `
          SELECT
            mr.id::text AS id,
            mr."integrationId" AS "integrationId",
            ro.uuid::text AS "riskObjectId",
            mr.data AS data,
            ic."mappingRules" AS "mappingRules"
          FROM monitoring_result mr
          INNER JOIN integration_config ic ON ic.id = mr."integrationId"
          INNER JOIN risk_object ro ON ro.id = mr."riskObjectId"
          WHERE mr.id = $1
          FOR UPDATE
        `,
        [id],
      );

      const row = result.rows[0];
      if (!row) {
        this.logger.warn(`Monitoring result row not found during SELECT FOR UPDATE (id=${id})`);
        await client.query('ROLLBACK');
        this.logger.log(`DB transaction ROLLBACK completed (id=${id})`);
        return null;
      }

      this.logger.log(
        `Monitoring result row locked and loaded (id=${id}, integrationId=${row.integrationId}, riskObjectId=${row.riskObjectId})`,
      );
      await client.query('DELETE FROM monitoring_result WHERE id = $1', [id]);
      this.logger.log(`Monitoring result row deleted from table (id=${id})`);
      await client.query('COMMIT');
      this.logger.log(`DB transaction COMMIT completed (id=${id})`);

      return {
        integrationId: row.integrationId,
        riskObjectId: row.riskObjectId,
        data: row.data,
        mappingRules: row.mappingRules,
      };
    } catch (error) {
      this.logger.error(
        `Failed to take monitoring result by id=${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await client.query('ROLLBACK');
      this.logger.log(`DB transaction ROLLBACK completed after error (id=${id})`);
      throw error;
    } finally {
      this.logger.log(`Releasing DB client after monitoring result take (id=${id})`);
      client.release();
    }
  }
}
