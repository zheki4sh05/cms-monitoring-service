import type { Migration } from './migration.interface.js';

export const createIntegrationConfigTableMigration: Migration = {
  id: '202604131900_create_integration_config_table',
  description: 'Create integration_config table',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_config (
        id BIGSERIAL PRIMARY KEY,
        "companyId" VARCHAR(128) NOT NULL,
        name VARCHAR(255) NOT NULL,
        "integrationKind" VARCHAR(16) NOT NULL,
        "endpointUrl" VARCHAR(2048) NOT NULL,
        "riskObjectId" VARCHAR(64) NOT NULL,
        "mappingRules" JSONB NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "authorName" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        CONSTRAINT chk_integration_kind CHECK ("integrationKind" IN ('PUSH', 'PULL', 'BROKER'))
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_integration_config_company
      ON integration_config ("companyId")
    `);
  },
};
