import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import type { RiskObject } from '../../core/risk-object/domain/risk-object.js';
import type {
  RiskObjectChangeHistoryDetails,
  RiskObjectChangeHistoryPage,
  RiskObjectDetails,
  RiskObjectListPage,
  RiskObjectModelBrief,
  RiskObjectRepository,
  UpdateRiskObjectInput,
} from '../../core/risk-object/ports/risk-object-repository.port.js';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

@Injectable()
export class PostgresRiskObjectRepository implements RiskObjectRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(riskObject: RiskObject): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const code = await this.getNextCompanyScopedCode(client, riskObject.companyId);

      await client.query(
        `
          INSERT INTO risk_object (id, "companyId", code, name, definition, "createdAt", "updatedAt", active)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
        `,
        [
          riskObject.id,
          riskObject.companyId,
          code,
          riskObject.name,
          JSON.stringify(riskObject.definition),
          riskObject.createdAt,
          riskObject.updatedAt,
          riskObject.active,
        ],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listModelsBrief(companyId: string): Promise<RiskObjectModelBrief[]> {
    const result = await this.pool.query<{ id: string; name: string }>(
      `
        SELECT id, name
        FROM risk_object
        WHERE "companyId" = $1
        ORDER BY name ASC, id ASC
      `,
      [companyId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      uuid: row.id,
      name: row.name,
    }));
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

  async getChangeHistoryById(
    companyId: string,
    historyId: number,
  ): Promise<RiskObjectChangeHistoryDetails | null> {
    const result = await this.pool.query<{
      id: number;
      riskObjectId: string;
      changedAt: Date;
      riskObjectName: string;
      description: string;
      authorName: string;
    }>(
      `
        SELECT
          id,
          "riskObjectId" AS "riskObjectId",
          "changedAt" AS "changedAt",
          name AS "riskObjectName",
          "changeComment" AS description,
          "authorName" AS "authorName"
        FROM risk_object_history
        WHERE "companyId" = $1 AND id = $2
        LIMIT 1
      `,
      [companyId, historyId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      riskObjectId: row.riskObjectId,
      changedAt: new Date(row.changedAt),
      riskObjectName: row.riskObjectName,
      description: row.description,
      authorName: row.authorName,
    };
  }

  async getChangeHistoryPage(
    companyId: string,
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<RiskObjectChangeHistoryPage> {
    const offset = (page - 1) * pageSize;
    const limitWithLookahead = pageSize + 1;
    const searchQuery = q ? `%${q}%` : null;

    const result = await this.pool.query<{
      id: number;
      riskObjectId: string;
      name: string;
      changeComment: string;
      active: boolean;
      changedAt: Date;
    }>(
      `
        SELECT
          id,
          "riskObjectId" AS "riskObjectId",
          name,
          "changeComment" AS "changeComment",
          active,
          "changedAt" AS "changedAt"
        FROM risk_object_history
        WHERE "companyId" = $1
          AND ($2::text IS NULL OR name ILIKE $2 OR "changeComment" ILIKE $2)
        ORDER BY "changedAt" DESC, id DESC
        LIMIT $3 OFFSET $4
      `,
      [companyId, searchQuery, limitWithLookahead, offset],
    );

    const hasMore = result.rows.length > pageSize;
    const visibleRows = hasMore ? result.rows.slice(0, pageSize) : result.rows;

    return {
      items: visibleRows.map((row) => ({
        id: row.id,
        riskObjectId: row.riskObjectId,
        name: row.name,
        changeComment: row.changeComment,
        status: row.active ? 'active' : 'archived',
        changedAt: new Date(row.changedAt),
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
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const currentResult = await client.query<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        definition: Record<string, unknown>;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>(
        `
          SELECT
            id,
            "companyId" AS "companyId",
            code,
            name,
            definition,
            active,
            "createdAt" AS "createdAt",
            "updatedAt" AS "updatedAt"
          FROM risk_object
          WHERE "companyId" = $1 AND id = $2
          FOR UPDATE
        `,
        [input.companyId, input.id],
      );

      const currentRow = currentResult.rows[0];
      if (!currentRow) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query(
        `
          INSERT INTO risk_object_history (
            "riskObjectId",
            "companyId",
            code,
            name,
            definition,
            active,
            "createdAt",
            "updatedAt",
            "changeComment",
            "authorName",
            "changedAt"
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, NOW())
        `,
        [
          currentRow.id,
          currentRow.companyId,
          currentRow.code,
          currentRow.name,
          JSON.stringify(currentRow.definition),
          currentRow.active,
          currentRow.createdAt,
          currentRow.updatedAt,
          input.changeComment,
          input.authorName,
        ],
      );

      const updateResult = await client.query<{ updatedAt: Date }>(
        `
          UPDATE risk_object
          SET
            name = $3,
            definition = $4::jsonb,
            "updatedAt" = NOW()
          WHERE "companyId" = $1 AND id = $2
          RETURNING "updatedAt" AS "updatedAt"
        `,
        [input.companyId, input.id, input.name, JSON.stringify(input.definition)],
      );

      await client.query('COMMIT');
      const updatedRow = updateResult.rows[0];
      return updatedRow ? new Date(updatedRow.updatedAt) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatusById(companyId: string, id: string, status: 'active' | 'archived'): Promise<Date | null> {
    const active = status === 'active';

    const result = await this.pool.query<{ updatedAt: Date }>(
      `
        UPDATE risk_object
        SET
          active = $3,
          "updatedAt" = NOW()
        WHERE "companyId" = $1 AND id = $2
        RETURNING "updatedAt" AS "updatedAt"
      `,
      [companyId, id, active],
    );

    const updatedRow = result.rows[0];
    return updatedRow ? new Date(updatedRow.updatedAt) : null;
  }

  private async getNextCompanyScopedCode(client: PoolClient, companyId: string): Promise<string> {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [companyId]);

    const result = await client.query<{ nextNumber: number }>(
      `
        SELECT COALESCE(MAX((substring(code from 'RO-(\\d+)'))::int), 0) + 1 AS "nextNumber"
        FROM risk_object
        WHERE "companyId" = $1
          AND code ~ '^RO-\\d+$'
      `,
      [companyId],
    );

    const nextNumber = result.rows[0]?.nextNumber ?? 1;
    return `RO-${String(nextNumber).padStart(3, '0')}`;
  }
}
