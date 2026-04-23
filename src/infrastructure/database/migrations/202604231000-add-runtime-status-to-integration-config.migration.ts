import type { Migration } from './migration.interface.js';

export const addRuntimeStatusToIntegrationConfigMigration: Migration = {
  id: '202604231000_add_runtime_status_to_integration_config',
  description: 'Add runtime status to integration_config and default active=false',
  async up(client) {
    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS status VARCHAR(16)
    `);

    await client.query(`
      UPDATE integration_config
      SET status = CASE
        WHEN active = TRUE THEN 'work'
        ELSE 'stop'
      END
      WHERE status IS NULL
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN status SET NOT NULL
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN status SET DEFAULT 'idle'
    `);

    await client.query(`
      ALTER TABLE integration_config
      DROP CONSTRAINT IF EXISTS chk_integration_runtime_status
    `);

    await client.query(`
      ALTER TABLE integration_config
      ADD CONSTRAINT chk_integration_runtime_status
      CHECK (status IN ('idle', 'loading', 'work', 'failed', 'stop'))
    `);

    await client.query(`
      ALTER TABLE integration_config
      ALTER COLUMN active SET DEFAULT FALSE
    `);
  },
};
