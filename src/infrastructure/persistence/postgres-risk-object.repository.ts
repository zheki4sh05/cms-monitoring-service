import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { RiskObject } from '../../core/risk-object/domain/risk-object.js';
import type {
  RiskObjectDetails,
  RiskObjectListPage,
  RiskObjectRepository,
  UpdateRiskObjectInput,
} from '../../core/risk-object/ports/risk-object-repository.port.js';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

@Injectable()
export class PostgresRiskObjectRepository implements RiskObjectRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(riskObject: RiskObject): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO risk_object (id, "companyId", name, definition, "createdAt", "updatedAt", active)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      `,
      [
        riskObject.id,
        riskObject.companyId,
        riskObject.name,
        JSON.stringify(riskObject.definition),
        riskObject.createdAt,
        riskObject.updatedAt,
        riskObject.active,
      ],
    );
  }

  async getListPage(companyId: string, page: number, pageSize: number): Promise<RiskObjectListPage> {
    const offset = (page - 1) * pageSize;
    const limitWithLookahead = pageSize + 1;

    const result = await this.pool.query<{
      id: string;
      code: string;
      name: string;
      active: boolean;
      updatedAt: Date;
    }>(
      `
        SELECT id, code, name, active, "updatedAt"
        FROM risk_object
        WHERE "companyId" = $3
        ORDER BY "updatedAt" DESC, id DESC
        LIMIT $1 OFFSET $2
      `,
      [limitWithLookahead, offset, companyId],
    );

    const hasMore = result.rows.length > pageSize;
    const visibleRows = hasMore ? result.rows.slice(0, pageSize) : result.rows;

    return {
      items: visibleRows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.active ? 'active' : 'archived',
        updatedAt: new Date(row.updatedAt),
      })),
      hasMore,
    };
  }

  async getById(companyId: string, id: string): Promise<RiskObjectDetails | null> {
    const result = await this.pool.query<{
      id: string;
      code: string;
      name: string;
      active: boolean;
      updatedAt: Date;
      definition: Record<string, unknown>;
    }>(
      `
        SELECT id, code, name, active, "updatedAt", definition
        FROM risk_object
        WHERE "companyId" = $1 AND id = $2
        LIMIT 1
      `,
      [companyId, id],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.active ? 'active' : 'archived',
      updatedAt: new Date(row.updatedAt),
      definition: row.definition ?? {},
    };
  }

  async updateById(input: UpdateRiskObjectInput): Promise<Date | null> {
    const active = input.status === undefined ? null : input.status === 'active';

    const result = await this.pool.query<{ updatedAt: Date }>(
      `
        UPDATE risk_object
        SET
          name = $3,
          definition = $4::jsonb,
          active = COALESCE($5, active),
          "updatedAt" = NOW()
        WHERE "companyId" = $1 AND id = $2
        RETURNING "updatedAt"
      `,
      [input.companyId, input.id, input.name, JSON.stringify(input.definition), active],
    );

    const updatedRow = result.rows[0];
    return updatedRow ? new Date(updatedRow.updatedAt) : null;
  }
}
