export interface AuthenticatedUser {
  userId: string;
  username?: string;
  roles: string[];
  scopes: string[];
  clientId?: string;
}
