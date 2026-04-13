import type { Migration } from './migration.interface.js';

export const createRiskObjectTableMigration: Migration = {
  id: '202604131000_create_risk_object_table',
  description: 'Create risk_object table',
  async up(client) {
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS risk_object_code_seq START WITH 1 INCREMENT BY 1
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_object (
        id VARCHAR(64) PRIMARY KEY,
        "companyId" VARCHAR(128) NOT NULL,
        code VARCHAR(32) NOT NULL UNIQUE DEFAULT ('RO-' || lpad(nextval('risk_object_code_seq')::text, 3, '0')),
        name VARCHAR(255) NOT NULL,
        definition JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        active BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_risk_object_company_updated_at
      ON risk_object ("companyId", "updatedAt" DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_object_history (
        id BIGSERIAL PRIMARY KEY,
        "riskObjectId" VARCHAR(64) NOT NULL REFERENCES risk_object(id) ON DELETE CASCADE,
        "companyId" VARCHAR(128),
        code VARCHAR(32),
        name VARCHAR(255) NOT NULL,
        definition JSONB NOT NULL,
        active BOOLEAN NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "changeComment" TEXT NOT NULL,
        "authorName" VARCHAR(255) NOT NULL,
        "changedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_risk_object_history_risk_object_changed_at
      ON risk_object_history ("riskObjectId", "changedAt" DESC)
    `);
  },
};
