import type { Migration } from './migration.interface.js';

export const changeMonitoringIdsToUuidMigration: Migration = {
  id: '202604251800_change_monitoring_ids_to_uuid',
  description: 'Change monitoring_result and monitoring_retry ids to UUID',
  async up(client) {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await client.query(`
      ALTER TABLE monitoring_result DROP CONSTRAINT IF EXISTS monitoring_result_pkey;
      ALTER TABLE monitoring_result DROP COLUMN IF EXISTS id;
      ALTER TABLE monitoring_result ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
      ALTER TABLE monitoring_result ADD CONSTRAINT monitoring_result_pkey PRIMARY KEY (id);
    `);

    await client.query(`
      ALTER TABLE monitoring_retry DROP CONSTRAINT IF EXISTS monitoring_retry_pkey;
      ALTER TABLE monitoring_retry DROP COLUMN IF EXISTS id;
      ALTER TABLE monitoring_retry ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
      ALTER TABLE monitoring_retry ADD CONSTRAINT monitoring_retry_pkey PRIMARY KEY (id);
    `);
  },
};
