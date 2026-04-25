import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

export interface CreateMonitoringRetryInput {
  data: unknown;
  riskObjectId: string;
  integrationId: number;
  processDate: Date;
}

export interface MonitoringRetryItem {
  id: string;
  data: unknown;
  riskObjectId: string;
  integrationId: number;
  processDate: Date;
}

@Injectable()
export class PostgresMonitoringRetryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(input: CreateMonitoringRetryInput): Promise<string> {
    const generatedId = randomUUID();
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO monitoring_retry (
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
      throw new Error('Failed to persist monitoring_retry: id was not returned by database.');
    }

    return id;
  }

  async listPending(limit: number): Promise<MonitoringRetryItem[]> {
    const result = await this.pool.query<{
      id: string;
      data: unknown;
      riskObjectId: string;
      integrationId: number;
      processDate: Date;
    }>(
      `
        SELECT
          id::text AS id,
          data,
          "riskObjectId" AS "riskObjectId",
          "integrationId" AS "integrationId",
          process_date AS "processDate"
        FROM monitoring_retry
        ORDER BY process_date ASC, id ASC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      data: row.data,
      riskObjectId: row.riskObjectId,
      integrationId: row.integrationId,
      processDate: new Date(row.processDate),
    }));
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query('DELETE FROM monitoring_retry WHERE id = $1', [id]);
  }
}
