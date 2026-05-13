import type { Migration } from './migration.interface.js';

export const dropRiskObjectHistoryFkMigration: Migration = {
  id: '202605131200_drop_risk_object_history_fk',
  description:
    'Drop FK from risk_object_history to risk_object so history survives object deletion (audit + delete snapshot)',
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
          WHERE t.relname = 'risk_object_history' AND c.contype = 'f'
        LOOP
          EXECUTE format('ALTER TABLE risk_object_history DROP CONSTRAINT %I', r.name);
        END LOOP;
      END $$;
    `);
  },
};
