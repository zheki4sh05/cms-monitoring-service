import type {
  IntegrationConfig,
  IntegrationKind,
  IntegrationRuntimeStatus,
  PullConfig,
} from '../domain/integration-config.js';

export const INTEGRATION_CONFIG_REPOSITORY = Symbol('INTEGRATION_CONFIG_REPOSITORY');

export interface IntegrationConfigListItem {
  id: number;
  number: number;
  name: string;
  updatedAt: Date;
  active: boolean;
  status: IntegrationRuntimeStatus;
  invocationsSuccess: number;
  invocationsFailed: number;
  failedComment: string[];
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
  active: boolean;
  status: IntegrationRuntimeStatus;
  invocationsSuccess: number;
  invocationsFailed: number;
  failedComment: string[];
  authorName: string;
  updatedAt: Date;
}

export interface IntegrationInvocationStats {
  companyId: string;
  integrationId: number;
  invocationsSuccess: number;
  invocationsFailed: number;
  failedComment: string[];
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

export interface IntegrationConfigProcessManagerItem {
  id: number;
  companyId: string;
  name: string;
  endpointUrl: string;
  integrationKind: IntegrationKind;
  pullConfig: PullConfig | null;
  active: boolean;
  status: IntegrationRuntimeStatus;
  lastStatusChangedByUserId: string | null;
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
  getByIdForOutboxProcessing(
    id: number,
  ): Promise<{ id: number; companyId: string; riskObjectId: string; active: boolean } | null>;
  updateById(input: UpdateIntegrationConfigInput): Promise<Date | null>;
  updateActiveById(
    companyId: string,
    id: number,
    active: boolean,
    changedByUserId: string,
  ): Promise<Date | null>;
  listForProcessManager(): Promise<IntegrationConfigProcessManagerItem[]>;
  updateRuntimeStatusById(
    companyId: string,
    id: number,
    status: IntegrationRuntimeStatus,
  ): Promise<Date | null>;
  resetInvocationStatsById(companyId: string, id: number): Promise<Date | null>;
  registerInvocationResult(
    companyId: string,
    id: number,
    success: boolean,
    errorMessage?: string,
  ): Promise<IntegrationInvocationStats | null>;
  deleteById(companyId: string, id: number): Promise<Date | null>;
}
