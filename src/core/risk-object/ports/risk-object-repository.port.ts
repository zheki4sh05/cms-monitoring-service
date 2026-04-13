import type { RiskObject } from '../domain/risk-object.js';

export const RISK_OBJECT_REPOSITORY = Symbol('RISK_OBJECT_REPOSITORY');

export type RiskObjectStatus = 'active' | 'archived';

export interface RiskObjectListItem {
  id: string;
  code: string;
  name: string;
  status: RiskObjectStatus;
  updatedAt: Date;
}

export interface RiskObjectListPage {
  items: RiskObjectListItem[];
  hasMore: boolean;
}

export interface RiskObjectDetails {
  id: string;
  code: string;
  name: string;
  status: RiskObjectStatus;
  updatedAt: Date;
  definition: Record<string, unknown>;
}

export interface UpdateRiskObjectInput {
  companyId: string;
  id: string;
  name: string;
  definition: Record<string, unknown>;
  status?: RiskObjectStatus;
}

export interface RiskObjectRepository {
  save(riskObject: RiskObject): Promise<void>;
  getListPage(companyId: string, page: number, pageSize: number): Promise<RiskObjectListPage>;
  getById(companyId: string, id: string): Promise<RiskObjectDetails | null>;
  updateById(input: UpdateRiskObjectInput): Promise<Date | null>;
}
