export const PULL_INTEGRATION_INVOCATION_EVENT = 'integration.pull.invocation';

export interface PullIntegrationInvocationEvent {
  companyId: string;
  integrationId: number;
  success: boolean;
  errorMessage?: string;
  userId?: string;
}
