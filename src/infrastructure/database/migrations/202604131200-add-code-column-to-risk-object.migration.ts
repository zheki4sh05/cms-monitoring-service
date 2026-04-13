import type { Migration } from './migration.interface.js';

export const addCodeColumnToRiskObjectMigration: Migration = {
  id: '202604131200_add_code_column_to_risk_object',
  description: 'Add code column with RO- sequence to risk_object',
  async up(client) {
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS risk_object_code_seq START WITH 1 INCREMENT BY 1
    `);

    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS code VARCHAR(32)
    `);

    await client.query(`
      UPDATE risk_object
      SET code = 'RO-' || lpad(nextval('risk_object_code_seq')::text, 3, '0')
      WHERE code IS NULL
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN code SET DEFAULT ('RO-' || lpad(nextval('risk_object_code_seq')::text, 3, '0'))
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN code SET NOT NULL
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_risk_object_code ON risk_object(code)
    `);
  },
};
