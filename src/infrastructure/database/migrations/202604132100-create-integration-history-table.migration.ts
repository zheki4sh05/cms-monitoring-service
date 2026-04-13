import type { Migration } from './migration.interface.js';

export const createIntegrationHistoryTableMigration: Migration = {
  id: '202604132100_create_integration_history_table',
  description: 'Create integration_history table',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_history (
        id BIGSERIAL PRIMARY KEY,
        "integrationId" BIGINT NOT NULL REFERENCES integration_config(id) ON DELETE CASCADE,
        "companyId" VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        "integrationKind" VARCHAR(16) NOT NULL,
        "endpointUrl" VARCHAR(2048) NOT NULL,
        "riskObjectId" VARCHAR(64) NOT NULL,
        "mappingRules" JSONB NOT NULL,
        active BOOLEAN NOT NULL,
        "authorName" VARCHAR(255) NOT NULL,
        "changeComment" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "changedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_integration_history_kind CHECK ("integrationKind" IN ('PUSH', 'PULL', 'BROKER'))
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_integration_history_company_changed_at
      ON integration_history ("companyId", "changedAt" DESC)
    `);
  },
};
