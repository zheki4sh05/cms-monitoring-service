import type { AuthenticatedUser } from '../domain/authenticated-user.js';

export const ACCESS_TOKEN_VALIDATOR = Symbol('ACCESS_TOKEN_VALIDATOR');

export interface AccessTokenValidator {
  validate(token: string): Promise<AuthenticatedUser>;
}
