import type { Migration } from './migration.interface.js';

export const dropIntegrationHistoryFkMigration: Migration = {
  id: '202605131300_drop_integration_history_fk',
  description:
    'Drop FK from integration_history to integration_config so history survives integration deletion',
  async up(client) {
    await client.query(`
      DO $$
      DECLARE
        r record;
      BEGIN
        FOR r IN
          SELECT c.conname AS name
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'integration_history' AND c.contype = 'f'
        LOOP
          EXECUTE format('ALTER TABLE integration_history DROP CONSTRAINT %I', r.name);
        END LOOP;
      END $$;
    `);
  },
};
