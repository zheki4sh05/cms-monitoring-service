import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

export interface CreateMonitoringResultInput {
  data: unknown;
  riskObjectId: string;
  processDate: Date;
}

@Injectable()
export class PostgresMonitoringResultRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(input: CreateMonitoringResultInput): Promise<number> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO monitoring_result (
          data,
          "riskObjectId",
          process_date
        )
        VALUES ($1::jsonb, $2, $3)
        RETURNING id::text AS id
      `,
      [JSON.stringify(input.data ?? null), input.riskObjectId, input.processDate],
    );

    return Number(result.rows[0]?.id ?? '0');
  }
}
