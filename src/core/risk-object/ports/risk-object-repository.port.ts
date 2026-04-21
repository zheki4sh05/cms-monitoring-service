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

export interface RiskObjectModelBrief {
  id: string;
  uuid: string;
  name: string;
}

export interface RiskObjectChangeHistoryItem {
  id: number;
  riskObjectId: string;
  name: string;
  changeComment: string;
  status: RiskObjectStatus;
  changedAt: Date;
}

export interface RiskObjectChangeHistoryPage {
  items: RiskObjectChangeHistoryItem[];
  hasMore: boolean;
}

export interface RiskObjectChangeHistoryDetails {
  id: number;
  riskObjectId: string;
  changedAt: Date;
  riskObjectName: string;
  description: string;
  authorName: string;
}

export interface RiskObjectDetails {
  id: string;
  uuid: string;
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
  changeComment: string;
  authorName: string;
}

export interface RiskObjectRepository {
  save(riskObject: RiskObject): Promise<void>;
  listModelsBrief(companyId: string): Promise<RiskObjectModelBrief[]>;
  getListPage(companyId: string, page: number, pageSize: number): Promise<RiskObjectListPage>;
  getChangeHistoryPage(
    companyId: string,
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<RiskObjectChangeHistoryPage>;
  getChangeHistoryById(
    companyId: string,
    historyId: number,
  ): Promise<RiskObjectChangeHistoryDetails | null>;
  getById(companyId: string, id: string): Promise<RiskObjectDetails | null>;
  updateById(input: UpdateRiskObjectInput): Promise<Date | null>;
  updateStatusById(companyId: string, id: string, status: RiskObjectStatus): Promise<Date | null>;
}
