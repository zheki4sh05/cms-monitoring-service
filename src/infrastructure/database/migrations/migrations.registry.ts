import { createRiskObjectTableMigration } from './202604131000-create-risk-object-table.migration.js';
import { addActiveColumnToRiskObjectMigration } from './202604131100-add-active-column-to-risk-object.migration.js';
import { addCodeColumnToRiskObjectMigration } from './202604131200-add-code-column-to-risk-object.migration.js';
import { addUpdatedAtColumnToRiskObjectMigration } from './202604131300-add-updated-at-column-to-risk-object.migration.js';
import { normalizeRiskObjectCodeFormatMigration } from './202604131400-normalize-risk-object-code-format.migration.js';
import { addCompanyIdToRiskObjectMigration } from './202604131500-add-company-id-to-risk-object.migration.js';
import { createRiskObjectHistoryTableMigration } from './202604131700-create-risk-object-history-table.migration.js';
import { addAuthorNameToRiskObjectHistoryMigration } from './202604131800-add-author-name-to-risk-object-history.migration.js';
import type { Migration } from './migration.interface.js';

export const MIGRATIONS: Migration[] = [
  createRiskObjectTableMigration,
  addActiveColumnToRiskObjectMigration,
  addCodeColumnToRiskObjectMigration,
  addUpdatedAtColumnToRiskObjectMigration,
  normalizeRiskObjectCodeFormatMigration,
  addCompanyIdToRiskObjectMigration,
  createRiskObjectHistoryTableMigration,
  addAuthorNameToRiskObjectHistoryMigration,
];
