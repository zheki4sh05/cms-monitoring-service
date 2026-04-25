import type { Migration } from './migration.interface.js';

export const createMonitoringRetryTableMigration: Migration = {
  id: '202604251730_create_monitoring_retry_table',
  description: 'Create monitoring_retry table',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitoring_retry (
        id BIGSERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        "riskObjectId" VARCHAR(64) NOT NULL REFERENCES risk_object(id) ON DELETE RESTRICT,
        "integrationId" BIGINT NOT NULL REFERENCES integration_config(id) ON DELETE CASCADE,
        process_date TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monitoring_retry_integration_process_date
      ON monitoring_retry ("integrationId", process_date ASC)
    `);
  },
};
