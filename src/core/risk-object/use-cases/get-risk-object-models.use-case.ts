import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectModelBrief,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface GetRiskObjectModelsInput {
  companyId: string;
}

export class GetRiskObjectModelsUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectModelsInput): Promise<RiskObjectModelBrief[]> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    return this.riskObjectRepository.listModelsBrief(input.companyId.trim());
  }
}
