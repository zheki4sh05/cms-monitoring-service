import type { Migration } from './migration.interface.js';

export const addDepartmentIdToRiskObjectMigration: Migration = {
  id: '202605071600_add_department_id_to_risk_object',
  description: 'Add departmentId to risk_object and risk_object_history',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS "departmentId" VARCHAR(255)
    `);

    await client.query(`
      UPDATE risk_object
      SET "departmentId" = 'Unknown'
      WHERE "departmentId" IS NULL
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN "departmentId" SET NOT NULL
    `);

    await client.query(`
      ALTER TABLE risk_object_history
      ADD COLUMN IF NOT EXISTS "departmentId" VARCHAR(255)
    `);
  },
};
