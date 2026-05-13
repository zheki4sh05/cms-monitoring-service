import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectDetails,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectByIdInput {
  companyId: string;
  id: string;
}

export type GetRiskObjectByIdResult = RiskObjectDetails & { isDeleted: boolean };

export class GetRiskObjectByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectByIdInput): Promise<GetRiskObjectByIdResult | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.id?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    const companyId = input.companyId.trim();
    const id = input.id.trim();

    const live = await this.riskObjectRepository.getById(companyId, id);
    if (live) {
      return { ...live, isDeleted: false };
    }

    const fromHistory = await this.riskObjectRepository.getLatestSnapshotFromHistory(companyId, id);
    if (fromHistory) {
      return { ...fromHistory, isDeleted: true };
    }

    return null;
  }
}
