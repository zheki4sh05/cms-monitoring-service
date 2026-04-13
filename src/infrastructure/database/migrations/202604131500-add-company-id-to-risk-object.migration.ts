import type { Migration } from './migration.interface.js';

export const addCompanyIdToRiskObjectMigration: Migration = {
  id: '202604131500_add_company_id_to_risk_object',
  description: 'Add companyId column to risk_object',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(128)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_risk_object_company_updated_at
      ON risk_object ("companyId", "updatedAt" DESC)
    `);
  },
};
