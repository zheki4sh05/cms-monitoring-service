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
  },
};
