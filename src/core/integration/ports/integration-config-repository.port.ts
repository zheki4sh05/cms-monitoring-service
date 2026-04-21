import type { IntegrationConfig, IntegrationKind, PullConfig } from '../domain/integration-config.js';

export const INTEGRATION_CONFIG_REPOSITORY = Symbol('INTEGRATION_CONFIG_REPOSITORY');

export type IntegrationConfigStatus = 'active' | 'inactive';

export interface IntegrationConfigListItem {
  id: number;
  number: number;
  name: string;
  updatedAt: Date;
  status: IntegrationConfigStatus;
  authorName: string;
}

export interface IntegrationConfigListPage {
  items: IntegrationConfigListItem[];
  hasMore: boolean;
}

export interface IntegrationConfigHistoryItem {
  id: number;
  integrationId: number;
  changedAt: Date;
  configName: string;
  description: string;
  authorName: string;
}

export interface IntegrationConfigHistoryPage {
  items: IntegrationConfigHistoryItem[];
  hasMore: boolean;
}

export interface IntegrationConfigDetails {
  id: number;
  number: number;
  name: string;
  integrationKind: IntegrationKind;
  endpointUrl: string;
  riskObjectModelId: string;
  mappingRules: unknown;
  pullConfig: PullConfig | null;
  status: IntegrationConfigStatus;
  authorName: string;
  updatedAt: Date;
}

export interface UpdateIntegrationConfigInput {
  companyId: string;
  id: number;
  name: string;
  integrationKind: IntegrationKind;
  endpointUrl: string;
  riskObjectModelId: string;
  mappingRules: unknown;
  pullConfig?: PullConfig;
  authorName: string;
  changeComment: string;
}

export interface IntegrationConfigRepository {
  save(config: IntegrationConfig): Promise<number>;
  getListPage(companyId: string, page: number, pageSize: number): Promise<IntegrationConfigListPage>;
  getChangeHistoryPage(
    companyId: string,
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<IntegrationConfigHistoryPage>;
  getById(companyId: string, id: number): Promise<IntegrationConfigDetails | null>;
  updateById(input: UpdateIntegrationConfigInput): Promise<Date | null>;
  updateStatusById(companyId: string, id: number, status: IntegrationConfigStatus): Promise<Date | null>;
  deleteById(companyId: string, id: number): Promise<Date | null>;
}
