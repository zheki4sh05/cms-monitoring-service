import type { Migration } from './migration.interface.js';

export const addRiskObjectAuthorAndLastModifiedByMigration: Migration = {
  id: '202604251650_add_risk_object_author_and_last_modified_by',
  description: 'Add authorId and lastModifiedBy to risk_object',
  async up(client) {
    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS "authorId" VARCHAR(255)
    `);

    await client.query(`
      ALTER TABLE risk_object
      ADD COLUMN IF NOT EXISTS "lastModifiedBy" VARCHAR(255)
    `);

    await client.query(`
      UPDATE risk_object
      SET "authorId" = 'Unknown'
      WHERE "authorId" IS NULL
    `);

    await client.query(`
      UPDATE risk_object
      SET "lastModifiedBy" = COALESCE("authorId", 'Unknown')
      WHERE "lastModifiedBy" IS NULL
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN "authorId" SET NOT NULL
    `);

    await client.query(`
      ALTER TABLE risk_object
      ALTER COLUMN "lastModifiedBy" SET NOT NULL
    `);
  },
};
