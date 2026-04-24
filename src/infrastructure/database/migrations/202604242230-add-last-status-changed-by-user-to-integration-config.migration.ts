import type { Migration } from './migration.interface.js';

export const addLastStatusChangedByUserToIntegrationConfigMigration: Migration = {
  id: '202604242230_add_last_status_changed_by_user_to_integration_config',
  description: 'Add lastStatusChangedByUserId column to integration_config',
  async up(client) {
    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "lastStatusChangedByUserId" VARCHAR(128)
    `);
  },
};
