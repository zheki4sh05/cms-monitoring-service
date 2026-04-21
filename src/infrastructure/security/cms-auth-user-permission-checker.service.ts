import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type {
  CheckUserPermissionInput,
  UserPermissionChecker,
} from '../../core/auth/ports/user-permission-checker.port.js';

interface PermissionCheckResponse {
  access?: string;
}

@Injectable()
export class CmsAuthUserPermissionCheckerService implements UserPermissionChecker {
  private readonly logger = new Logger(CmsAuthUserPermissionCheckerService.name);
  private readonly authServiceBaseUrl = process.env.CMS_AUTH_SERVICE_URL ?? 'http://localhost:9091';

  async assertAccess(input: CheckUserPermissionInput): Promise<void> {
    const url = new URL(
      `/api/users/${encodeURIComponent(input.userId)}/permissions/check`,
      this.authServiceBaseUrl,
    );
    url.searchParams.set('permission', input.permission);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (input.authorizationHeader?.trim()) {
      headers.Authorization = input.authorizationHeader;
    }

    this.logger.log(`Checking permission in cms-auth-service (userId=${input.userId}, permission=${input.permission})`);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      this.logger.warn(
        `Permission check request failed (status=${response.status}, userId=${input.userId}, permission=${input.permission})`,
      );
      throw new UnauthorizedException('Access denied.');
    }

    let payload: PermissionCheckResponse | null = null;
    try {
      payload = (await response.json()) as PermissionCheckResponse;
    } catch {
      this.logger.warn(
        `Permission check returned invalid JSON (userId=${input.userId}, permission=${input.permission})`,
      );
      throw new UnauthorizedException('Access denied.');
    }

    if (payload?.access !== 'permit') {
      this.logger.warn(
        `Permission denied by cms-auth-service (userId=${input.userId}, permission=${input.permission}, access=${payload?.access ?? 'undefined'})`,
      );
      throw new UnauthorizedException('Access denied.');
    }
  }
}
