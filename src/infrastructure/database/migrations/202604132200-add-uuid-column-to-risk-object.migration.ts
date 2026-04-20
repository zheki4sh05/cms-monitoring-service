import type { Migration } from './migration.interface.js';

export const addUuidColumnToRiskObjectMigration: Migration = {
  id: '202604132200_add_uuid_column_to_risk_object',
  description: 'Add uuid column (RFC 4122) to risk_object',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid()
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_risk_object_uuid ON risk_object(uuid)
    `);
  },
};
