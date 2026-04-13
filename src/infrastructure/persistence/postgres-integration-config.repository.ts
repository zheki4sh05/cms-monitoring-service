import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { IntegrationConfig } from '../../core/integration/domain/integration-config.js';
import type {
  IntegrationConfigDetails,
  IntegrationConfigHistoryPage,
  IntegrationConfigListPage,
  IntegrationConfigRepository,
  UpdateIntegrationConfigInput,
} from '../../core/integration/ports/integration-config-repository.port.js';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

@Injectable()
export class PostgresIntegrationConfigRepository implements IntegrationConfigRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(config: IntegrationConfig): Promise<number> {
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO integration_config (
          "companyId",
          name,
          "integrationKind",
          "endpointUrl",
          "riskObjectId",
          "mappingRules",
          active,
          "authorName",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
        RETURNING id::text AS id
      `,
      [
        config.companyId,
        config.name,
        config.integrationKind,
        config.endpointUrl,
        config.riskObjectId,
        JSON.stringify(config.mappingRules),
        config.active,
        config.authorName,
        config.createdAt,
        config.updatedAt,
      ],
    );

    return Number(result.rows[0]?.id ?? '0');
  }

  async getListPage(companyId: string, page: number, pageSize: number): Promise<IntegrationConfigListPage> {
    const offset = (page - 1) * pageSize;
    const limitWithLookahead = pageSize + 1;

    const result = await this.pool.query<{
      id: number;
      name: string;
      updatedAt: Date;
      active: boolean;
      authorName: string;
    }>(
      `
        SELECT
          id,
          name,
          "updatedAt" AS "updatedAt",
          active,
          "authorName" AS "authorName"
        FROM integration_config
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
        number: row.id,
        name: row.name,
        updatedAt: new Date(row.updatedAt),
        status: row.active ? 'active' : 'inactive',
        authorName: row.authorName,
      })),
      hasMore,
    };
  }

  async getChangeHistoryPage(
    companyId: string,
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<IntegrationConfigHistoryPage> {
    const offset = (page - 1) * pageSize;
    const limitWithLookahead = pageSize + 1;
    const searchQuery = q ? `%${q}%` : null;

    const result = await this.pool.query<{
      id: number;
      integrationId: number;
      changedAt: Date;
      configName: string;
      description: string;
      authorName: string;
    }>(
      `
        SELECT
          id,
          "integrationId" AS "integrationId",
          "changedAt" AS "changedAt",
          name AS "configName",
          "changeComment" AS description,
          "authorName" AS "authorName"
        FROM integration_history
        WHERE "companyId" = $1
          AND ($2::text IS NULL OR name ILIKE $2 OR "changeComment" ILIKE $2 OR "authorName" ILIKE $2)
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
        integrationId: row.integrationId,
        changedAt: new Date(row.changedAt),
        configName: row.configName,
        description: row.description,
        authorName: row.authorName,
      })),
      hasMore,
    };
  }

  async getById(companyId: string, id: number): Promise<IntegrationConfigDetails | null> {
    const result = await this.pool.query<{
      id: number;
      name: string;
      integrationKind: 'PUSH' | 'PULL' | 'BROKER';
      endpointUrl: string;
      riskObjectModelId: string;
      mappingRules: unknown;
      active: boolean;
      authorName: string;
      updatedAt: Date;
    }>(
      `
        SELECT
          id,
          name,
          "integrationKind" AS "integrationKind",
          "endpointUrl" AS "endpointUrl",
          "riskObjectId" AS "riskObjectModelId",
          "mappingRules" AS "mappingRules",
          active,
          "authorName" AS "authorName",
          "updatedAt" AS "updatedAt"
        FROM integration_config
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
      number: row.id,
      name: row.name,
      integrationKind: row.integrationKind,
      endpointUrl: row.endpointUrl,
      riskObjectModelId: row.riskObjectModelId,
      mappingRules: row.mappingRules,
      status: row.active ? 'active' : 'inactive',
      authorName: row.authorName,
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateById(input: UpdateIntegrationConfigInput): Promise<Date | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const currentResult = await client.query<{
        id: number;
        companyId: string;
        name: string;
        integrationKind: 'PUSH' | 'PULL' | 'BROKER';
        endpointUrl: string;
        riskObjectId: string;
        mappingRules: unknown;
        active: boolean;
        authorName: string;
        createdAt: Date;
        updatedAt: Date;
      }>(
        `
          SELECT
            id,
            "companyId" AS "companyId",
            name,
            "integrationKind" AS "integrationKind",
            "endpointUrl" AS "endpointUrl",
            "riskObjectId" AS "riskObjectId",
            "mappingRules" AS "mappingRules",
            active,
            "authorName" AS "authorName",
            "createdAt" AS "createdAt",
            "updatedAt" AS "updatedAt"
          FROM integration_config
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
          INSERT INTO integration_history (
            "integrationId",
            "companyId",
            name,
            "integrationKind",
            "endpointUrl",
            "riskObjectId",
            "mappingRules",
            active,
            "authorName",
            "changeComment",
            "createdAt",
            "updatedAt",
            "changedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, NOW())
        `,
        [
          currentRow.id,
          currentRow.companyId,
          currentRow.name,
          currentRow.integrationKind,
          currentRow.endpointUrl,
          currentRow.riskObjectId,
          JSON.stringify(currentRow.mappingRules),
          currentRow.active,
          input.authorName,
          input.changeComment,
          currentRow.createdAt,
          currentRow.updatedAt,
        ],
      );

      const updateResult = await client.query<{ updatedAt: Date }>(
        `
          UPDATE integration_config
          SET
            name = $3,
            "integrationKind" = $4,
            "endpointUrl" = $5,
            "riskObjectId" = $6,
            "mappingRules" = $7::jsonb,
            "authorName" = $8,
            "updatedAt" = NOW()
          WHERE "companyId" = $1 AND id = $2
          RETURNING "updatedAt" AS "updatedAt"
        `,
        [
          input.companyId,
          input.id,
          input.name,
          input.integrationKind,
          input.endpointUrl,
          input.riskObjectModelId,
          JSON.stringify(input.mappingRules),
          input.authorName,
        ],
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

  async updateStatusById(
    companyId: string,
    id: number,
    status: 'active' | 'inactive',
  ): Promise<Date | null> {
    const active = status === 'active';

    const result = await this.pool.query<{ updatedAt: Date }>(
      `
        UPDATE integration_config
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
}
