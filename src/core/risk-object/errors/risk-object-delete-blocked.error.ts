export class RiskObjectDeleteBlockedError extends Error {
  constructor(
    message = 'Risk object cannot be deleted because it is referenced by monitoring results or retries.',
  ) {
    super(message);
    this.name = 'RiskObjectDeleteBlockedError';
  }
}
