import type { Migration } from './migration.interface.js';

export const scopeRiskObjectCodePerCompanyMigration: Migration = {
  id: '202604131600_scope_risk_object_code_per_company',
  description: 'Scope risk_object.code uniqueness per company',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      DROP CONSTRAINT IF EXISTS risk_object_code_key
    `);

    await client.query(`
      DROP INDEX IF EXISTS ux_risk_object_code
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_risk_object_company_code
      ON risk_object ("companyId", code)
    `);
  },
};
