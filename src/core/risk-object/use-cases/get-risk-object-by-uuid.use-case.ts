import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import type {
  RiskObjectDetails,
  RiskObjectRepository,
} from '../ports/risk-object-repository.port.js';

const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface GetRiskObjectByUuidInput {
  companyId: string;
  uuid: string;
}

export class GetRiskObjectByUuidUseCase {
  constructor(private readonly riskObjectRepository: RiskObjectRepository) {}

  async execute(input: GetRiskObjectByUuidInput): Promise<RiskObjectDetails | null> {
    if (!input.companyId?.trim()) {
      throw new DomainValidationError('companyId is required.');
    }

    const uuid = input.uuid?.trim();
    if (!uuid) {
      throw new DomainValidationError('uuid is required.');
    }

    if (!UUID_V4_LIKE_REGEX.test(uuid)) {
      throw new DomainValidationError('uuid must be a valid UUID.');
    }

    return this.riskObjectRepository.getByUuid(input.companyId.trim(), uuid);
  }
}
