import type { Migration } from './migration.interface.js';

export const addPullConfigToIntegrationConfigMigration: Migration = {
  id: '202604211200_add_pull_config_to_integration_config',
  description: 'Add pullConfig JSONB to integration tables',
  async up(client) {
    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "pullConfig" JSONB
    `);

    await client.query(`
      ALTER TABLE integration_history
      ADD COLUMN IF NOT EXISTS "pullConfig" JSONB
    `);
  },
};
