import type { Migration } from './migration.interface.js';

export const createMonitoringResultTableMigration: Migration = {
  id: '202604251630_create_monitoring_result_table',
  description: 'Create monitoring_result table',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitoring_result (
        id BIGSERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        "riskObjectId" VARCHAR(64) NOT NULL REFERENCES risk_object(id) ON DELETE RESTRICT,
        process_date TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monitoring_result_risk_object_process_date
      ON monitoring_result ("riskObjectId", process_date DESC)
    `);
  },
};
