import type { Migration } from './migration.interface.js';

export const enforceMonitoringUuidPrimaryKeysMigration: Migration = {
  id: '202604251820_enforce_monitoring_uuid_primary_keys',
  description: 'Enforce UUID PK/default for monitoring_result and monitoring_retry',
  async up(client) {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await client.query(`
      DO $$
      DECLARE
        id_data_type text;
      BEGIN
        SELECT data_type
        INTO id_data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'monitoring_result'
          AND column_name = 'id'
        LIMIT 1;

        IF id_data_type IS NULL THEN
          ALTER TABLE monitoring_result ADD COLUMN id UUID;
        ELSIF id_data_type <> 'uuid' THEN
          ALTER TABLE monitoring_result DROP CONSTRAINT IF EXISTS monitoring_result_pkey;
          ALTER TABLE monitoring_result DROP COLUMN id;
          ALTER TABLE monitoring_result ADD COLUMN id UUID;
        END IF;

        UPDATE monitoring_result
        SET id = gen_random_uuid()
        WHERE id IS NULL;

        ALTER TABLE monitoring_result
          ALTER COLUMN id SET DEFAULT gen_random_uuid(),
          ALTER COLUMN id SET NOT NULL;

        ALTER TABLE monitoring_result DROP CONSTRAINT IF EXISTS monitoring_result_pkey;
        ALTER TABLE monitoring_result ADD CONSTRAINT monitoring_result_pkey PRIMARY KEY (id);
      END $$;
    `);

    await client.query(`
      DO $$
      DECLARE
        id_data_type text;
      BEGIN
        SELECT data_type
        INTO id_data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'monitoring_retry'
          AND column_name = 'id'
        LIMIT 1;

        IF id_data_type IS NULL THEN
          ALTER TABLE monitoring_retry ADD COLUMN id UUID;
        ELSIF id_data_type <> 'uuid' THEN
          ALTER TABLE monitoring_retry DROP CONSTRAINT IF EXISTS monitoring_retry_pkey;
          ALTER TABLE monitoring_retry DROP COLUMN id;
          ALTER TABLE monitoring_retry ADD COLUMN id UUID;
        END IF;

        UPDATE monitoring_retry
        SET id = gen_random_uuid()
        WHERE id IS NULL;

        ALTER TABLE monitoring_retry
          ALTER COLUMN id SET DEFAULT gen_random_uuid(),
          ALTER COLUMN id SET NOT NULL;

        ALTER TABLE monitoring_retry DROP CONSTRAINT IF EXISTS monitoring_retry_pkey;
        ALTER TABLE monitoring_retry ADD CONSTRAINT monitoring_retry_pkey PRIMARY KEY (id);
      END $$;
    `);
  },
};
