import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  IntegrationConfig,
  IntegrationRuntimeStatus,
  PullConfig,
} from '../../core/integration/domain/integration-config.js';
import type {
  IntegrationConfigDetails,
  IntegrationConfigHistoryPage,
  IntegrationConfigListPage,
  IntegrationConfigRepository,
  IntegrationConfigProcessManagerItem,
  UpdateIntegrationConfigInput,
} from '../../core/integration/ports/integration-config-repository.port.js';
import { PG_POOL } from '../database/postgres/postgres.tokens.js';

@Injectable()
export class PostgresIntegrationConfigRepository implements IntegrationConfigRepository {
  private readonly logger = new Logger(PostgresIntegrationConfigRepository.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(config: IntegrationConfig): Promise<number> {
    this.logger.log(
      `Inserting integration config (companyId=${config.companyId}, integrationKind=${config.integrationKind}, hasPullConfig=${config.pullConfig !== undefined})`,
    );
    const result = await this.pool.query<{ id: string }>(
      `
        INSERT INTO integration_config (
          "companyId",
          name,
          "integrationKind",
          "endpointUrl",
          "riskObjectId",
          "mappingRules",
          "pullConfig",
          active,
          status,
          "authorName",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12)
        RETURNING id::text AS id
      `,
      [
        config.companyId,
        config.name,
        config.integrationKind,
        config.endpointUrl,
        config.riskObjectId,
        this.stringifyJson(config.mappingRules),
        this.stringifyJson(config.pullConfig),
        config.active,
        config.status,
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
      status: IntegrationRuntimeStatus;
      authorName: string;
    }>(
      `
        SELECT
          id,
          name,
          "updatedAt" AS "updatedAt",
          active,
          status,
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
        active: row.active,
        status: row.status,
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
    this.logger.log(`Loading integration config from DB (companyId=${companyId}, id=${id})`);
    const result = await this.pool.query<{
      id: number;
      name: string;
      integrationKind: 'PUSH' | 'PULL' | 'BROKER';
      endpointUrl: string;
      riskObjectModelId: string;
      mappingRules: unknown;
      pullConfig: PullConfig | null;
      active: boolean;
      status: IntegrationRuntimeStatus;
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
          "pullConfig" AS "pullConfig",
          active,
          status,
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
      this.logger.warn(`Integration config not found in DB (companyId=${companyId}, id=${id})`);
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
      pullConfig: row.pullConfig,
      active: row.active,
      status: row.status,
      authorName: row.authorName,
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateById(input: UpdateIntegrationConfigInput): Promise<Date | null> {
    this.logger.log(
      `Updating integration config in DB transaction (companyId=${input.companyId}, id=${input.id}, hasPullConfig=${input.pullConfig !== undefined})`,
    );
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      this.logger.log('DB transaction started for integration update');

      const currentResult = await client.query<{
        id: number;
        companyId: string;
        name: string;
        integrationKind: 'PUSH' | 'PULL' | 'BROKER';
        endpointUrl: string;
        riskObjectId: string;
        mappingRules: unknown;
        pullConfig: PullConfig | null;
        active: boolean;
        status: IntegrationRuntimeStatus;
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
            "pullConfig" AS "pullConfig",
            active,
            status,
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
        this.logger.warn(`No row found for update (companyId=${input.companyId}, id=${input.id})`);
        await client.query('ROLLBACK');
        return null;
      }

      this.logger.log(`Writing change history snapshot for integration id=${input.id}`);
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
            "pullConfig",
            active,
            "authorName",
            "changeComment",
            "createdAt",
            "updatedAt",
            "changedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, NOW())
        `,
        [
          currentRow.id,
          currentRow.companyId,
          currentRow.name,
          currentRow.integrationKind,
          currentRow.endpointUrl,
          currentRow.riskObjectId,
          this.stringifyJson(currentRow.mappingRules),
          this.stringifyJson(currentRow.pullConfig),
          currentRow.active,
          input.authorName,
          input.changeComment,
          currentRow.createdAt,
          currentRow.updatedAt,
        ],
      );

      this.logger.log(`Applying integration update for id=${input.id}`);
      const updateResult = await client.query<{ updatedAt: Date }>(
        `
          UPDATE integration_config
          SET
            name = $3,
            "integrationKind" = $4,
            "endpointUrl" = $5,
            "riskObjectId" = $6,
            "mappingRules" = $7::jsonb,
            "pullConfig" = $8::jsonb,
            "authorName" = $9,
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
          this.stringifyJson(input.mappingRules),
          this.stringifyJson(input.pullConfig),
          input.authorName,
        ],
      );

      await client.query('COMMIT');
      this.logger.log(`DB transaction committed for integration id=${input.id}`);
      const updatedRow = updateResult.rows[0];
      return updatedRow ? new Date(updatedRow.updatedAt) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `DB transaction rolled back for integration id=${input.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      client.release();
    }
  }

  async updateActiveById(
    companyId: string,
    id: number,
    active: boolean,
  ): Promise<Date | null> {
    this.logger.log(`Updating integration active flag (companyId=${companyId}, id=${id}, active=${active})`);

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

  async listForProcessManager(): Promise<IntegrationConfigProcessManagerItem[]> {
    this.logger.log('Loading integration configs for process manager synchronization');
    const result = await this.pool.query<{
      id: number;
      companyId: string;
      name: string;
      endpointUrl: string;
      integrationKind: 'PUSH' | 'PULL' | 'BROKER';
      active: boolean;
      status: IntegrationRuntimeStatus;
    }>(
      `
        SELECT
          id,
          "companyId" AS "companyId",
          name,
          "endpointUrl" AS "endpointUrl",
          "integrationKind" AS "integrationKind",
          active,
          status
        FROM integration_config
        ORDER BY id ASC
      `,
    );

    return result.rows.map((row) => ({
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      endpointUrl: row.endpointUrl,
      integrationKind: row.integrationKind,
      active: row.active,
      status: row.status,
    }));
  }

  async updateRuntimeStatusById(
    companyId: string,
    id: number,
    status: IntegrationRuntimeStatus,
  ): Promise<Date | null> {
    this.logger.log(
      `Updating integration runtime status (companyId=${companyId}, id=${id}, status=${status})`,
    );
    const result = await this.pool.query<{ updatedAt: Date }>(
      `
        UPDATE integration_config
        SET
          status = $3,
          "updatedAt" = NOW()
        WHERE "companyId" = $1 AND id = $2
        RETURNING "updatedAt" AS "updatedAt"
      `,
      [companyId, id, status],
    );

    const updatedRow = result.rows[0];
    return updatedRow ? new Date(updatedRow.updatedAt) : null;
  }

  async deleteById(companyId: string, id: number): Promise<Date | null> {
    this.logger.log(`Deleting integration config from DB (companyId=${companyId}, id=${id})`);
    const result = await this.pool.query<{ deletedAt: Date }>(
      `
        DELETE FROM integration_config
        WHERE "companyId" = $1 AND id = $2
        RETURNING NOW() AS "deletedAt"
      `,
      [companyId, id],
    );

    const deletedRow = result.rows[0];
    if (!deletedRow) {
      this.logger.warn(`Integration config not found for deletion (companyId=${companyId}, id=${id})`);
      return null;
    }

    return new Date(deletedRow.deletedAt);
  }

  private stringifyJson(value: unknown): string | null {
    if (value === undefined) {
      return null;
    }

    return JSON.stringify(value);
  }
}
