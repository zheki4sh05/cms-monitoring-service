export type IntegrationKind = 'PUSH' | 'PULL' | 'BROKER';

export interface PullConfigQueryParam {
  key: string;
  value: string;
}

export interface PullConfig {
  pollingPreset: string;
  pollingMinutes: number;
  authType: string;
  authBasicLogin?: string;
  authBasicPassword?: string;
  requestUri: string;
  requestQueryParams: PullConfigQueryParam[];
  pagedPollingEnabled: boolean;
  pageSize?: number;
  sinceStartDateEnabled: boolean;
}

export interface IntegrationConfig {
  id?: number;
  companyId: string;
  name: string;
  integrationKind: IntegrationKind;
  endpointUrl: string;
  riskObjectId: string;
  mappingRules: unknown;
  pullConfig?: PullConfig;
  active: boolean;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}
