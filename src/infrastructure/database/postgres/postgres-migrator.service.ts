import { Inject, Injectable, Logger } from '@nestjs/common';
import { PG_POOL } from './postgres.tokens.js';
import { MIGRATIONS } from '../migrations/migrations.registry.js';
import type { OnModuleInit } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';

@Injectable()
export class PostgresMigratorService implements OnModuleInit {
  private readonly logger = new Logger(PostgresMigratorService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.applyPendingMigrations();
  }

  private async applyPendingMigrations(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureMigrationsTable(client);

      const appliedMigrationIds = await this.getAppliedMigrationIds(client);
      for (const migration of MIGRATIONS) {
        if (appliedMigrationIds.has(migration.id)) {
          continue;
        }

        this.logger.log(`Applying migration: ${migration.id} (${migration.description})`);
        await migration.up(client);
        await client.query(
          `
            INSERT INTO schema_migrations (id, description, applied_at)
            VALUES ($1, $2, NOW())
          `,
          [migration.id, migration.description],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureMigrationsTable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL
      )
    `);
  }

  private async getAppliedMigrationIds(client: PoolClient): Promise<Set<string>> {
    const result = await client.query<{ id: string }>('SELECT id FROM schema_migrations');
    return new Set(result.rows.map((row) => row.id));
  }
}
