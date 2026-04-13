import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectStatus,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

export interface UpdateRiskObjectByIdInput {
  companyId: string;
  id: string;
  name: string;
  definition: unknown;
  status?: RiskObjectStatus;
}

export class UpdateRiskObjectByIdUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: UpdateRiskObjectByIdInput): Promise<Date | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.id?.trim()) {
      throw new DomainValidationError('id is required.');
    }

    if (!input.name?.trim()) {
      throw new DomainValidationError('name is required.');
    }

    if (!input.definition || typeof input.definition !== 'object' || Array.isArray(input.definition)) {
      throw new DomainValidationError('definition must be a JSON object.');
    }

    if (input.status && input.status !== 'active' && input.status !== 'archived') {
      throw new DomainValidationError('status must be active or archived.');
    }

    const updatePayload: {
      companyId: string;
      id: string;
      name: string;
      definition: Record<string, unknown>;
      status?: RiskObjectStatus;
    } = {
      companyId: input.companyId.trim(),
      id: input.id.trim(),
      name: input.name.trim(),
      definition: input.definition as Record<string, unknown>,
    };

    if (input.status !== undefined) {
      updatePayload.status = input.status;
    }

    return this.riskObjectRepository.updateById(updatePayload);
  }
}
