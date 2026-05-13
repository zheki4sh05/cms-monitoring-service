import type { RiskObject } from '../domain/risk-object.js';

export const RISK_OBJECT_REPOSITORY = Symbol('RISK_OBJECT_REPOSITORY');

export type RiskObjectStatus = 'active' | 'archived';

export interface RiskObjectListItem {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  status: RiskObjectStatus;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface RiskObjectListPage {
  items: RiskObjectListItem[];
  hasMore: boolean;
}

export interface RiskObjectModelBrief {
  id: string;
  uuid: string;
  name: string;
  departmentId: string;
  isDeleted: boolean;
}

export interface RiskObjectChangeHistoryItem {
  id: number;
  riskObjectId: string;
  name: string;
  departmentId: string;
  changeComment: string;
  status: RiskObjectStatus;
  changedAt: Date;
  isDeleted: boolean;
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
  departmentId: string;
  description: string;
  authorName: string;
  isDeleted: boolean;
}

export interface RiskObjectDetails {
  id: string;
  uuid: string;
  code: string;
  name: string;
  departmentId: string;
  status: RiskObjectStatus;
  updatedAt: Date;
  definition: Record<string, unknown>;
  isDeleted?: boolean;
}

export interface UpdateRiskObjectInput {
  companyId: string;
  id: string;
  lastModifiedBy: string;
  departmentId: string;
  name: string;
  definition: Record<string, unknown>;
  changeComment: string;
  authorName: string;
}

export interface RiskObjectRepository {
  save(riskObject: RiskObject): Promise<void>;
  listModelsBrief(companyId: string): Promise<RiskObjectModelBrief[]>;
  getListPage(
    companyId: string,
    page: number,
    pageSize: number,
    nameSubstring?: string,
  ): Promise<RiskObjectListPage>;
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
  getByUuid(companyId: string, uuid: string): Promise<RiskObjectDetails | null>;
  getLatestSnapshotFromHistory(companyId: string, riskObjectId: string): Promise<RiskObjectDetails | null>;
  findLiveRiskObjectIds(companyId: string, riskObjectIds: string[]): Promise<Set<string>>;
  findRiskObjectNamesByIds(companyId: string, riskObjectIds: string[]): Promise<Map<string, string>>;
  findLatestRiskObjectNamesFromHistory(companyId: string, riskObjectIds: string[]): Promise<Map<string, string>>;
  updateById(input: UpdateRiskObjectInput): Promise<Date | null>;
  updateStatusById(companyId: string, id: string, status: RiskObjectStatus): Promise<Date | null>;
  deleteById(companyId: string, id: string, authorName: string): Promise<Date | null>;
}
