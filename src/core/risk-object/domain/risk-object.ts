export interface RiskObject {
  id: string;
  code?: string;
  companyId: string;
  name: string;
  definition: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
