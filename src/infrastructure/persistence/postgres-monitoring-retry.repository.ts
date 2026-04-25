import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

export interface CreateMonitoringRetryInput {
  data: unknown;
  riskObjectId: string;
  integrationId: number;
  processDate: Date;
}

export interface MonitoringRetryItem {
  id: number;
  data: unknown;
  riskObjectId: string;
  integrationId: number;
  processDate: Date;
}

@Injectable()
export class PostgresMonitoringRetryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(input: CreateMonitoringRetryInput): Promise<number> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO monitoring_retry (
          data,
          "riskObjectId",
          "integrationId",
          process_date
        )
        VALUES ($1::jsonb, $2, $3, $4)
        RETURNING id::text AS id
      `,
      [JSON.stringify(input.data ?? null), input.riskObjectId, input.integrationId, input.processDate],
    );

    return Number(result.rows[0]?.id ?? '0');
  }

  async listPending(limit: number): Promise<MonitoringRetryItem[]> {
    const result = await this.pool.query<{
      id: number;
      data: unknown;
      riskObjectId: string;
      integrationId: number;
      processDate: Date;
    }>(
      `
        SELECT
          id,
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

  async deleteById(id: number): Promise<void> {
    await this.pool.query('DELETE FROM monitoring_retry WHERE id = $1', [id]);
  }
}
