import type { Migration } from './migration.interface.js';

export const addIntegrationIdToMonitoringResultMigration: Migration = {
  id: '202604251740_add_integration_id_to_monitoring_result',
  description: 'Add required integrationId to monitoring_result',
  async up(client) {
    await client.query(`
      ALTER TABLE monitoring_result
      ADD COLUMN IF NOT EXISTS "integrationId" BIGINT
    `);

    await client.query(`
      WITH resolved AS (
        SELECT
          mr.id AS "monitoringResultId",
          (
            SELECT ic.id
            FROM integration_config ic
            WHERE ic."riskObjectId" = mr."riskObjectId"
            ORDER BY ic."updatedAt" DESC, ic.id DESC
            LIMIT 1
          ) AS "resolvedIntegrationId"
        FROM monitoring_result mr
        WHERE mr."integrationId" IS NULL
      )
      UPDATE monitoring_result mr
      SET "integrationId" = resolved."resolvedIntegrationId"
      FROM resolved
      WHERE mr.id = resolved."monitoringResultId"
        AND resolved."resolvedIntegrationId" IS NOT NULL
    `);

    await client.query(`
      DO $$
      DECLARE
        unresolved_count integer;
      BEGIN
        SELECT COUNT(*)::int
        INTO unresolved_count
        FROM monitoring_result
        WHERE "integrationId" IS NULL;

        IF unresolved_count > 0 THEN
          RAISE EXCEPTION 'monitoring_result contains % rows with NULL integrationId after automatic backfill; manual fix is required', unresolved_count;
        END IF;
      END
      $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_monitoring_result_integration_id'
        ) THEN
          ALTER TABLE monitoring_result
          ADD CONSTRAINT fk_monitoring_result_integration_id
          FOREIGN KEY ("integrationId")
          REFERENCES integration_config(id)
          ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await client.query(`
      ALTER TABLE monitoring_result
      ALTER COLUMN "integrationId" SET NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monitoring_result_integration_process_date
      ON monitoring_result ("integrationId", process_date DESC)
    `);
  },
};
