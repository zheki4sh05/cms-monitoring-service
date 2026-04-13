import type { Migration } from './migration.interface.js';

export const createRiskObjectHistoryTableMigration: Migration = {
  id: '202604131700_create_risk_object_history_table',
  description: 'Create risk_object_history table',
  async up(client) {
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
