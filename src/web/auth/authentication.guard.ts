import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../core/auth/domain/authenticated-user.js';
import {
  ACCESS_TOKEN_VALIDATOR,
  type AccessTokenValidator,
} from '../../core/auth/ports/access-token-validator.port.js';
import { IS_PUBLIC_ENDPOINT } from './public.decorator.js';

type RequestWithAuthUser = Request & {
  authenticatedUser?: AuthenticatedUser;
};

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(
    @Inject(ACCESS_TOKEN_VALIDATOR)
    private readonly accessTokenValidator: AccessTokenValidator,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicEndpoint = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ENDPOINT, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicEndpoint) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const token = this.extractBearerToken(request.headers.authorization);

    try {
      const authenticatedUser = await this.accessTokenValidator.validate(token);
      request.authenticatedUser = authenticatedUser;
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown authentication error';
      this.logger.warn(`Authentication failed for ${request.method} ${request.url}: ${reason}`);
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Authorization token is empty.');
    }

    return token;
  }
}
