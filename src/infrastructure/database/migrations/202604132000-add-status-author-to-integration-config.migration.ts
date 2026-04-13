import type { Migration } from './migration.interface.js';

export const addStatusAuthorToIntegrationConfigMigration: Migration = {
  id: '202604132000_add_status_author_to_integration_config',
  description: 'Add active and authorName to integration_config',
  async up(client) {
    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS active BOOLEAN
    `);

    await client.query(`
      UPDATE integration_config
      SET active = TRUE
      WHERE active IS NULL
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN active SET NOT NULL
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN active SET DEFAULT TRUE
    `);

    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "authorName" VARCHAR(255)
    `);

    await client.query(`
      UPDATE integration_config
      SET "authorName" = 'Unknown'
      WHERE "authorName" IS NULL
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN "authorName" SET NOT NULL
    `);
  },
};
