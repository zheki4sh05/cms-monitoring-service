import type { PoolClient } from 'pg';

export interface Migration {
  id: string;
  description: string;
  up(client: PoolClient): Promise<void>;
}
