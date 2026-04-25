import type { Migration } from './migration.interface.js';

export const addInvocationMetricsToIntegrationConfigMigration: Migration = {
  id: '202604251510_add_invocation_metrics_to_integration_config',
  description: 'Add invocation metrics columns to integration_config',
  async up(client) {
    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "invocationsSuccess" INTEGER NOT NULL DEFAULT 0
    `);

    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "invocationsFailed" INTEGER NOT NULL DEFAULT 0
    `);

    await client.query(`
      ALTER TABLE integration_config
      ADD COLUMN IF NOT EXISTS "failedComment" JSONB NOT NULL DEFAULT '[]'::jsonb
    `);
  },
};
