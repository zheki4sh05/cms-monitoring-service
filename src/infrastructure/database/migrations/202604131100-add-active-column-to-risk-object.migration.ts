import type { Migration } from './migration.interface.js';

export const addActiveColumnToRiskObjectMigration: Migration = {
  id: '202604131100_add_active_column_to_risk_object',
  description: 'Add active column to risk_object',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT FALSE
    `);
  },
};
