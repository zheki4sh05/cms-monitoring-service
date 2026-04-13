import type { Migration } from './migration.interface.js';

export const normalizeRiskObjectCodeFormatMigration: Migration = {
  id: '202604131400_normalize_risk_object_code_format',
  description: 'Normalize risk_object.code format to RO-001 style',
  async up(client) {
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS risk_object_code_seq START WITH 1 INCREMENT BY 1
    `);

    await client.query(`
      UPDATE risk_object
      SET code = 'RO-' || lpad((substring(code from 'RO-(\\d+)'))::text, 3, '0')
      WHERE code ~ '^RO-\\d+$'
    `);

    await client.query(`
      SELECT setval(
        'risk_object_code_seq',
        GREATEST(
          COALESCE((SELECT MAX((substring(code from 'RO-(\\d+)'))::int) FROM risk_object), 0),
          1
        )
      )
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN code SET DEFAULT ('RO-' || lpad(nextval('risk_object_code_seq')::text, 3, '0'))
    `);
  },
};
