import type { RiskObjectRepository } from '../../risk-object/ports/risk-object-repository.port.js';
import { ORPHAN_REFERENCE_LABELS } from '../../shared/constants/orphan-reference-labels.js';

export interface ResolvedRiskObjectModelForIntegration {
  id: string;
  name: string;
  isDeleted: boolean;
}

export async function resolveRiskObjectModelForIntegration(
  riskObjectRepository: RiskObjectRepository,
  companyId: string,
  riskObjectModelId: string,
): Promise<ResolvedRiskObjectModelForIntegration> {
  const trimmedId = riskObjectModelId?.trim() ?? '';
  if (!trimmedId) {
    return {
      id: '',
      name: ORPHAN_REFERENCE_LABELS.notSet,
      isDeleted: false,
    };
  }

  const live = await riskObjectRepository.getById(companyId, trimmedId);
  if (live) {
    return {
      id: trimmedId,
      name: live.name?.trim() || ORPHAN_REFERENCE_LABELS.parentNotFound,
      isDeleted: false,
    };
  }

  const fromHistory = await riskObjectRepository.getLatestSnapshotFromHistory(companyId, trimmedId);
  if (fromHistory) {
    return {
      id: trimmedId,
      name: fromHistory.name?.trim() || ORPHAN_REFERENCE_LABELS.parentNotFound,
      isDeleted: true,
    };
  }

  return {
    id: trimmedId,
    name: ORPHAN_REFERENCE_LABELS.parentNotFound,
    isDeleted: true,
  };
}
