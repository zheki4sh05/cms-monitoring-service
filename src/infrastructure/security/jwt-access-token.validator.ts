import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  importSPKI,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyOptions,
} from 'jose';
import type { AuthenticatedUser } from '../../core/auth/domain/authenticated-user.js';
import type { AccessTokenValidator } from '../../core/auth/ports/access-token-validator.port.js';

@Injectable()
export class JwtAccessTokenValidator implements AccessTokenValidator {
  private readonly issuer: string | undefined;
  private readonly requiredScopes: string[];
  private readonly publicKeyPem: string | undefined;
  private readonly remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  constructor(private readonly configService: ConfigService) {
    this.issuer = this.configService.get<string>('AUTH_ISSUER') || undefined;
    this.requiredScopes = this.parseCsv(this.configService.get<string>('AUTH_REQUIRED_SCOPES'));
    this.publicKeyPem = this.normalizePem(this.configService.get<string>('OAUTH2_PUBLIC_KEY_PEM'));

    if (!this.publicKeyPem) {
      const jwksUrl = this.resolveJwksUrl();
      if (jwksUrl) {
        this.remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
      }
    }
  }

  async validate(token: string): Promise<AuthenticatedUser> {
    const payload = this.publicKeyPem
      ? await this.verifyWithPublicKey(token)
      : await this.verifyWithJwks(token);

    const scopes = this.extractScopes(payload.scope);
    this.assertRequiredScopes(scopes);

    const userId = this.extractUserId(payload);
    if (!userId) {
      throw new Error('Access token does not contain userId/user_id claim.');
    }

    const authenticatedUser: AuthenticatedUser = {
      userId,
      roles: this.extractStringArray(payload.roles),
      scopes,
    };

    const username = this.asString(payload.user_name ?? payload.sub);
    if (username) {
      authenticatedUser.username = username;
    }

    const clientId = this.asString(payload.client_id);
    if (clientId) {
      authenticatedUser.clientId = clientId;
    }

    return authenticatedUser;
  }

  private async verifyWithPublicKey(token: string): Promise<JWTPayload> {
    const key = await importSPKI(this.publicKeyPem!, 'RS256');
    const verified = await jwtVerify(token, key, this.buildVerifyOptions());
    return verified.payload;
  }

  private async verifyWithJwks(token: string): Promise<JWTPayload> {
    if (!this.remoteJwks) {
      throw new Error(
        'JWT verification is not configured. Set OAUTH2_PUBLIC_KEY_PEM or AUTH_JWKS_URL/AUTH_ISSUER.',
      );
    }

    const verified = await jwtVerify(token, this.remoteJwks, this.buildVerifyOptions());
    return verified.payload;
  }

  private buildVerifyOptions(): JWTVerifyOptions {
    const verifyOptions: JWTVerifyOptions = {
      algorithms: ['RS256'],
    };

    if (this.issuer) {
      verifyOptions.issuer = this.issuer;
    }

    return verifyOptions;
  }

  private resolveJwksUrl(): string | undefined {
    const configuredJwks = this.configService.get<string>('AUTH_JWKS_URL');
    if (configuredJwks) {
      return configuredJwks;
    }

    if (!this.issuer) {
      return undefined;
    }

    return `${this.issuer.replace(/\/$/, '')}/oauth2/jwks`;
  }

  private normalizePem(value?: string): string | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    return value.replace(/\\n/g, '\n');
  }

  private parseCsv(value?: string): string[] {
    if (!value?.trim()) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private extractUserId(payload: JWTPayload): string | undefined {
    return this.asString(payload.userId ?? payload.user_id);
  }

  private extractScopes(scopeClaim: unknown): string[] {
    if (!scopeClaim) {
      return [];
    }

    if (typeof scopeClaim === 'string') {
      return scopeClaim
        .split(/\s+/)
        .map((scope) => scope.trim())
        .filter(Boolean);
    }

    if (Array.isArray(scopeClaim)) {
      return scopeClaim
        .map((scope) => this.asString(scope))
        .filter((scope): scope is string => Boolean(scope));
    }

    return [];
  }

  private assertRequiredScopes(scopes: string[]): void {
    if (!this.requiredScopes.length) {
      return;
    }

    const missingScopes = this.requiredScopes.filter((requiredScope) => !scopes.includes(requiredScope));
    if (missingScopes.length) {
      throw new Error(`Missing required scopes: ${missingScopes.join(', ')}`);
    }
  }

  private extractStringArray(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.asString(item))
        .filter((item): item is string => Boolean(item));
    }

    const singleValue = this.asString(value);
    if (!singleValue) {
      return [];
    }

    return singleValue
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}
