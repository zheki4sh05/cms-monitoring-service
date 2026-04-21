export type UserPermission = 'MANAGE_INTEGRATIONS' | 'VIEW_INTEGRATIONS_PAGE';

export interface CheckUserPermissionInput {
  userId: string;
  permission: UserPermission;
  authorizationHeader?: string;
}

export interface UserPermissionChecker {
  assertAccess(input: CheckUserPermissionInput): Promise<void>;
}

export const USER_PERMISSION_CHECKER = Symbol('USER_PERMISSION_CHECKER');
