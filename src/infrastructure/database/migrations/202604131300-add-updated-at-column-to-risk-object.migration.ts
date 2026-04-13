import type { Migration } from './migration.interface.js';

export const addUpdatedAtColumnToRiskObjectMigration: Migration = {
  id: '202604131300_add_updated_at_column_to_risk_object',
  description: 'Add updatedAt column to risk_object',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP
    `);

    await client.query(`
      UPDATE risk_object
      SET "updatedAt" = "createdAt"
      WHERE "updatedAt" IS NULL
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN "updatedAt" SET NOT NULL
    `);
  },
};
