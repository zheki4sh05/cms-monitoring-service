import type { RiskObject } from '../domain/risk-object.js';
import type { RiskObjectRepository } from '../ports/risk-object-repository.port.js';
import type { UuidGenerator } from '../../shared/ports/uuid-generator.port.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';

export interface CreateRiskObjectInput {
  companyId: string;
  name: string;
  definition: unknown;
}

export class CreateRiskObjectUseCase {
  constructor(
    private readonly riskObjectRepository: RiskObjectRepository,
    private readonly uuidGenerator: UuidGenerator,
  ) {}

  async execute(input: CreateRiskObjectInput): Promise<RiskObject> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    if (!input.name?.trim()) {
      throw new DomainValidationError('Risk object name is required.');
    }

    if (!input.definition || typeof input.definition !== 'object' || Array.isArray(input.definition)) {
      throw new DomainValidationError('Risk object definition must be a JSON object.');
    }

    const now = new Date();

    const riskObject: RiskObject = {
      id: this.uuidGenerator.generate(),
      companyId: input.companyId.trim(),
      name: input.name.trim(),
      definition: input.definition as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
      active: false,
    };

    await this.riskObjectRepository.save(riskObject);
    return riskObject;
  }
}
