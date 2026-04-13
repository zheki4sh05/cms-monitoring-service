export type IntegrationKind = 'PUSH' | 'PULL' | 'BROKER';

export interface IntegrationConfig {
  id?: number;
  companyId: string;
  name: string;
  integrationKind: IntegrationKind;
  endpointUrl: string;
  riskObjectId: string;
  mappingRules: unknown;
  active: boolean;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}
