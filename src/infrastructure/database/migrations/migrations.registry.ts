import { createRiskObjectTableMigration } from './202604131000-create-risk-object-table.migration.js';
import { addActiveColumnToRiskObjectMigration } from './202604131100-add-active-column-to-risk-object.migration.js';
import { addCodeColumnToRiskObjectMigration } from './202604131200-add-code-column-to-risk-object.migration.js';
import { addUpdatedAtColumnToRiskObjectMigration } from './202604131300-add-updated-at-column-to-risk-object.migration.js';
import { normalizeRiskObjectCodeFormatMigration } from './202604131400-normalize-risk-object-code-format.migration.js';
import { addCompanyIdToRiskObjectMigration } from './202604131500-add-company-id-to-risk-object.migration.js';
import { scopeRiskObjectCodePerCompanyMigration } from './202604131600-scope-risk-object-code-per-company.migration.js';
import { createRiskObjectHistoryTableMigration } from './202604131700-create-risk-object-history-table.migration.js';
import { addAuthorNameToRiskObjectHistoryMigration } from './202604131800-add-author-name-to-risk-object-history.migration.js';
import { createIntegrationConfigTableMigration } from './202604131900-create-integration-config-table.migration.js';
import { addStatusAuthorToIntegrationConfigMigration } from './202604132000-add-status-author-to-integration-config.migration.js';
import { createIntegrationHistoryTableMigration } from './202604132100-create-integration-history-table.migration.js';
import { addUuidColumnToRiskObjectMigration } from './202604132200-add-uuid-column-to-risk-object.migration.js';
import { addPullConfigToIntegrationConfigMigration } from './202604211200-add-pull-config-to-integration-config.migration.js';
import { addRuntimeStatusToIntegrationConfigMigration } from './202604231000-add-runtime-status-to-integration-config.migration.js';
import { addLastStatusChangedByUserToIntegrationConfigMigration } from './202604242230-add-last-status-changed-by-user-to-integration-config.migration.js';
import { addInvocationMetricsToIntegrationConfigMigration } from './202604251510-add-invocation-metrics-to-integration-config.migration.js';
import { createMonitoringResultTableMigration } from './202604251630-create-monitoring-result-table.migration.js';
import { addRiskObjectAuthorAndLastModifiedByMigration } from './202604251650-add-risk-object-author-and-last-modified-by.migration.js';
import { createMonitoringRetryTableMigration } from './202604251730-create-monitoring-retry-table.migration.js';
import { addIntegrationIdToMonitoringResultMigration } from './202604251740-add-integration-id-to-monitoring-result.migration.js';
import { changeMonitoringIdsToUuidMigration } from './202604251800-change-monitoring-ids-to-uuid.migration.js';
import { enforceMonitoringUuidPrimaryKeysMigration } from './202604251820-enforce-monitoring-uuid-primary-keys.migration.js';
import type { Migration } from './migration.interface.js';

export const MIGRATIONS: Migration[] = [
  createRiskObjectTableMigration,
  addActiveColumnToRiskObjectMigration,
  addCodeColumnToRiskObjectMigration,
  addUpdatedAtColumnToRiskObjectMigration,
  normalizeRiskObjectCodeFormatMigration,
  addCompanyIdToRiskObjectMigration,
  scopeRiskObjectCodePerCompanyMigration,
  createRiskObjectHistoryTableMigration,
  addAuthorNameToRiskObjectHistoryMigration,
  createIntegrationConfigTableMigration,
  addStatusAuthorToIntegrationConfigMigration,
  createIntegrationHistoryTableMigration,
  addPullConfigToIntegrationConfigMigration,
  addRuntimeStatusToIntegrationConfigMigration,
  addLastStatusChangedByUserToIntegrationConfigMigration,
  addInvocationMetricsToIntegrationConfigMigration,
  createMonitoringResultTableMigration,
  addRiskObjectAuthorAndLastModifiedByMigration,
  createMonitoringRetryTableMigration,
  addIntegrationIdToMonitoringResultMigration,
  changeMonitoringIdsToUuidMigration,
  enforceMonitoringUuidPrimaryKeysMigration,
  addUuidColumnToRiskObjectMigration,
];
