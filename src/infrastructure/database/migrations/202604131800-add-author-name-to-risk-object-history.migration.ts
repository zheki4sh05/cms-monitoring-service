import type { Migration } from './migration.interface.js';

export const addAuthorNameToRiskObjectHistoryMigration: Migration = {
  id: '202604131800_add_author_name_to_risk_object_history',
  description: 'Add authorName to risk_object_history',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object_history
      ADD COLUMN IF NOT EXISTS "authorName" VARCHAR(255)
    `);

    await client.query(`
      UPDATE risk_object_history
      SET "authorName" = 'Unknown'
      WHERE "authorName" IS NULL
    `);

    await client.query(`
      ALTER TABLE risk_object_history
      ALTER COLUMN "authorName" SET NOT NULL
    `);
  },
};
