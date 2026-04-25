import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type { RiskObjectRepository } from '../ports/risk-object-repository.port.js';

export interface UpdateRiskObjectByIdInput {
  companyId: string;
  id: string;
  lastModifiedBy: string;
  name: string;
  definition: unknown;
  changeComment: string;
  authorName: string;
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

    if (!input.changeComment?.trim()) {
      throw new DomainValidationError('changeComment is required.');
    }

    if (!input.authorName?.trim()) {
      throw new DomainValidationError('authorName is required.');
    }

    if (!input.lastModifiedBy?.trim()) {
      throw new DomainValidationError('lastModifiedBy is required.');
    }

    const updatePayload: {
      companyId: string;
      id: string;
      lastModifiedBy: string;
      name: string;
      definition: Record<string, unknown>;
      changeComment: string;
      authorName: string;
    } = {
      companyId: input.companyId.trim(),
      id: input.id.trim(),
      lastModifiedBy: input.lastModifiedBy.trim(),
      name: input.name.trim(),
      definition: input.definition as Record<string, unknown>,
      changeComment: input.changeComment.trim(),
      authorName: input.authorName.trim(),
    };

    return this.riskObjectRepository.updateById(updatePayload);
  }
}
